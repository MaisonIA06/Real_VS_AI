"""
Views for the game API.
"""
import random
from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz, MediaPair, GameSession, GameAnswer, GlobalStats
from .serializers import (
    QuizListSerializer,
    GameSessionCreateSerializer,
    GameSessionSerializer,
    MediaPairGameSerializer,
    AnswerSubmitSerializer,
    AnswerResponseSerializer,
    GameResultSerializer,
    LeaderboardEntrySerializer,
    PseudoSubmitSerializer,
)


class QuizListView(APIView):
    """List available quizzes."""

    def get(self, request):
        quizzes = Quiz.objects.filter(is_active=True)
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)


class GameSessionView(APIView):
    """Create a new game session or get session details."""

    def post(self, request):
        """Start a new game session."""
        serializer = GameSessionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz_id = serializer.validated_data.get('quiz_id')
        quiz = None
        pairs = []

        if quiz_id:
            try:
                quiz = Quiz.objects.get(id=quiz_id, is_active=True)
            except Quiz.DoesNotExist:
                return Response(
                    {'error': 'Quiz non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get pairs for the session
        if quiz and not quiz.is_random:
            # Use quiz-specific pairs in order
            pairs = list(quiz.pairs.filter(is_active=True).order_by('quizpair__order')[:10])
        else:
            # Random mode: pick 10 random pairs
            all_pairs = list(MediaPair.objects.filter(is_active=True))
            pairs = random.sample(all_pairs, min(10, len(all_pairs)))

        if len(pairs) < 1:
            return Response(
                {'error': 'Pas assez de paires disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get audience type from request
        audience_type = serializer.validated_data.get('audience_type', 'public')

        # Create session
        session = GameSession.objects.create(quiz=quiz, audience_type=audience_type)

        # Generate random positions for real media (left or right) - only for image/video
        positions = {}
        for pair in pairs:
            if pair.media_type != 'audio':
                positions[pair.id] = random.choice(['left', 'right'])

        # Store positions in session (we'll use cache or session storage in production)
        # For now, store in the request session or encode in response
        request.session[f'positions_{session.session_key}'] = positions
        request.session[f'pairs_{session.session_key}'] = [p.id for p in pairs]

        # Serialize pairs for response
        pairs_serializer = MediaPairGameSerializer(
            pairs,
            many=True,
            context={'request': request, 'positions': positions}
        )

        response_data = {
            'session_key': str(session.session_key),
            'quiz_name': quiz.name if quiz else 'Mode Aléatoire',
            'pairs': pairs_serializer.data,
            'total_pairs': len(pairs),
        }

        return Response(response_data, status=status.HTTP_201_CREATED)


class AnswerSubmitView(APIView):
    """Submit an answer for a game session."""

    def post(self, request, session_key):
        try:
            session = GameSession.objects.get(session_key=session_key, is_completed=False)
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Session non trouvée ou déjà terminée'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        pair_id = serializer.validated_data['pair_id']
        choice = serializer.validated_data['choice']
        response_time_ms = serializer.validated_data['response_time_ms']

        # Get the pair
        try:
            pair = MediaPair.objects.get(id=pair_id)
        except MediaPair.DoesNotExist:
            return Response(
                {'error': 'Paire non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if answer is correct (player must find the AI-generated media)
        if pair.media_type == 'audio':
            # For audio: choice is 'real' or 'ai', compare with pair.is_real
            is_correct = (
                (choice == 'real' and pair.is_real is True) or
                (choice == 'ai' and pair.is_real is False)
            )
            ai_position = 'ai' if pair.is_real is False else 'real'
        else:
            # For image/video: use left/right positions
            positions = request.session.get(f'positions_{session.session_key}', {})
            # Convert string keys back to int if needed
            positions = {int(k): v for k, v in positions.items()}
            real_position = positions.get(pair_id, 'left')
            # AI position is the opposite of real position
            ai_position = 'right' if real_position == 'left' else 'left'
            # Player wins if they find the AI (click on the AI image)
            is_correct = (choice == ai_position)

        # Calculate points
        base_points = 100 if is_correct else 0
        streak_bonus = 0
        time_bonus = 0

        if is_correct:
            # Streak bonus: +10 per consecutive correct, max +50
            session.current_streak += 1
            streak_bonus = min(session.current_streak * 10, 50)
            
            # Time bonus: up to 50 points if answered within 5 seconds
            if response_time_ms < 5000:
                time_bonus = int((5000 - response_time_ms) / 100)
            
            if session.current_streak > session.streak_max:
                session.streak_max = session.current_streak
        else:
            session.current_streak = 0

        points_earned = base_points + streak_bonus + time_bonus
        session.score += points_earned
        session.time_total_ms += response_time_ms

        # Get current answer count for order
        current_order = session.answers.count() + 1

        # Create answer record
        with transaction.atomic():
            GameAnswer.objects.create(
                session=session,
                media_pair=pair,
                is_correct=is_correct,
                response_time_ms=response_time_ms,
                order=current_order,
                points_earned=points_earned,
            )

            # Update global stats
            global_stats, created = GlobalStats.objects.get_or_create(media_pair=pair)
            global_stats.total_attempts = F('total_attempts') + 1
            if is_correct:
                global_stats.correct_answers = F('correct_answers') + 1
            global_stats.save()

            # Check if session is complete
            pairs_in_session = request.session.get(f'pairs_{session.session_key}', [])
            if current_order >= len(pairs_in_session):
                session.is_completed = True

            session.save()

        # Get fresh global stats for response
        global_stats.refresh_from_db()

        response_data = {
            'is_correct': is_correct,
            'hint': pair.hint,
            'ai_position': ai_position,
            'points_earned': points_earned,
            'current_streak': session.current_streak,
            'total_score': session.score,
            'global_stats': {
                'total_attempts': global_stats.total_attempts,
                'success_rate': global_stats.success_rate,
            },
            'is_session_complete': session.is_completed,
        }

        return Response(response_data)


class GameResultView(APIView):
    """Get final results for a completed game session."""

    def get(self, request, session_key):
        try:
            session = GameSession.objects.get(session_key=session_key)
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Session non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GameResultSerializer(session)
        return Response(serializer.data)

    def post(self, request, session_key):
        """Submit pseudo for leaderboard."""
        try:
            session = GameSession.objects.get(session_key=session_key, is_completed=True)
        except GameSession.DoesNotExist:
            return Response(
                {'error': 'Session non trouvée ou non terminée'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PseudoSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session.pseudo = serializer.validated_data['pseudo']
        session.save()

        return Response({'message': 'Pseudo enregistré', 'pseudo': session.pseudo})


class LeaderboardView(APIView):
    """Get leaderboard."""

    def get(self, request):
        quiz_id = request.query_params.get('quiz_id')
        limit = int(request.query_params.get('limit', 10))

        sessions = GameSession.objects.filter(
            is_completed=True,
            pseudo__isnull=False,
        ).exclude(pseudo='')

        if quiz_id:
            sessions = sessions.filter(quiz_id=quiz_id)

        sessions = sessions.order_by('-score', 'time_total_ms')[:limit]

        serializer = LeaderboardEntrySerializer(sessions, many=True)
        return Response(serializer.data)

