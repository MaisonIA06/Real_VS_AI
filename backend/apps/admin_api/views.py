"""
Views for the admin API.
"""
from django.db.models import Avg, Count
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from apps.game.models import Category, MediaPair, Quiz, GameSession, GlobalStats
from .serializers import (
    CategoryAdminSerializer,
    MediaPairAdminSerializer,
    MediaPairCreateSerializer,
    QuizAdminSerializer,
    QuizCreateSerializer,
    DashboardStatsSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD operations for categories."""
    queryset = Category.objects.all()
    serializer_class = CategoryAdminSerializer
    pagination_class = None


class MediaPairViewSet(viewsets.ModelViewSet):
    """CRUD operations for media pairs."""
    queryset = MediaPair.objects.select_related('category').all()
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MediaPairCreateSerializer
        return MediaPairAdminSerializer

    def get_serializer_context(self):
        """Add request to serializer context for building absolute URLs."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Filter by media type
        media_type = self.request.query_params.get('media_type')
        if media_type:
            queryset = queryset.filter(media_type=media_type)

        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset


class QuizViewSet(viewsets.ModelViewSet):
    """CRUD operations for quizzes."""
    queryset = Quiz.objects.prefetch_related('pairs', 'quizpair_set').all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuizCreateSerializer
        return QuizAdminSerializer


@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics."""
    total_categories = Category.objects.count()
    total_pairs = MediaPair.objects.count()
    total_quizzes = Quiz.objects.count()
    total_sessions = GameSession.objects.count()
    completed_sessions = GameSession.objects.filter(is_completed=True).count()

    # Average score
    avg_score = GameSession.objects.filter(
        is_completed=True
    ).aggregate(avg=Avg('score'))['avg'] or 0

    # Recent sessions
    recent_sessions = list(
        GameSession.objects.filter(is_completed=True)
        .order_by('-created_at')[:10]
        .values('pseudo', 'score', 'streak_max', 'created_at')
    )

    # Top pairs by attempts
    top_pairs = list(
        GlobalStats.objects.select_related('media_pair', 'media_pair__category')
        .order_by('-total_attempts')[:10]
        .values(
            'media_pair__id',
            'media_pair__category__name',
            'total_attempts',
            'correct_answers'
        )
    )

    stats = {
        'total_categories': total_categories,
        'total_pairs': total_pairs,
        'total_quizzes': total_quizzes,
        'total_sessions': total_sessions,
        'completed_sessions': completed_sessions,
        'average_score': round(avg_score, 1),
        'recent_sessions': recent_sessions,
        'top_pairs': top_pairs,
    }

    return Response(stats)

