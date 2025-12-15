"""
Serializers for the admin API.
"""
from rest_framework import serializers
from django.conf import settings
from apps.game.models import Category, MediaPair, Quiz, QuizPair, GameSession, GlobalStats


class CategoryAdminSerializer(serializers.ModelSerializer):
    pairs_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'pairs_count', 'created_at']

    def get_pairs_count(self, obj):
        return obj.media_pairs.count()


class MediaPairAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stats = serializers.SerializerMethodField()
    real_media = serializers.SerializerMethodField()
    ai_media = serializers.SerializerMethodField()
    audio_media = serializers.SerializerMethodField()

    class Meta:
        model = MediaPair
        fields = [
            'id', 'category', 'category_name', 'real_media', 'ai_media', 'audio_media', 'is_real',
            'media_type', 'difficulty', 'hint', 'is_active', 'stats', 'created_at'
        ]

    def get_stats(self, obj):
        try:
            stats = obj.global_stats
            return {
                'total_attempts': stats.total_attempts,
                'correct_answers': stats.correct_answers,
                'success_rate': stats.success_rate,
            }
        except GlobalStats.DoesNotExist:
            return {
                'total_attempts': 0,
                'correct_answers': 0,
                'success_rate': 0,
            }

    def get_real_media(self, obj):
        if obj.real_media:
            request = self.context.get('request')
            if request:
                url = obj.real_media.url
                if url.startswith('/'):
                    scheme = request.scheme
                    host = request.get_host()
                    # Extraire le hostname sans port
                    hostname = host.split(':')[0] if ':' in host else host
                    # Toujours utiliser le port 8080 pour les médias (via Nginx)
                    return f"{scheme}://{hostname}:8080{url}"
                return url
            return obj.real_media.url if obj.real_media else None
        return None

    def get_ai_media(self, obj):
        if obj.ai_media:
            request = self.context.get('request')
            if request:
                url = obj.ai_media.url
                if url.startswith('/'):
                    scheme = request.scheme
                    host = request.get_host()
                    hostname = host.split(':')[0] if ':' in host else host
                    return f"{scheme}://{hostname}:8080{url}"
                return url
            return obj.ai_media.url if obj.ai_media else None
        return None

    def get_audio_media(self, obj):
        if obj.audio_media:
            request = self.context.get('request')
            if request:
                url = obj.audio_media.url
                if url.startswith('/'):
                    scheme = request.scheme
                    host = request.get_host()
                    hostname = host.split(':')[0] if ':' in host else host
                    return f"{scheme}://{hostname}:8080{url}"
                return url
            return obj.audio_media.url if obj.audio_media else None
        return None


class MediaPairCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaPair
        fields = ['category', 'real_media', 'ai_media', 'audio_media', 'is_real', 'media_type', 'difficulty', 'hint', 'is_active']


class QuizPairSerializer(serializers.ModelSerializer):
    media_pair_details = MediaPairAdminSerializer(source='media_pair', read_only=True)

    class Meta:
        model = QuizPair
        fields = ['id', 'media_pair', 'media_pair_details', 'order']


class QuizAdminSerializer(serializers.ModelSerializer):
    quiz_pairs = QuizPairSerializer(source='quizpair_set', many=True, read_only=True)
    pairs_count = serializers.SerializerMethodField()
    sessions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'name', 'description', 'is_random', 'is_active',
            'pairs_count', 'sessions_count', 'quiz_pairs', 'created_at'
        ]

    def get_pairs_count(self, obj):
        return obj.pairs.count()

    def get_sessions_count(self, obj):
        return obj.game_sessions.count()


class QuizCreateSerializer(serializers.ModelSerializer):
    pair_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Quiz
        fields = ['name', 'description', 'is_random', 'is_active', 'pair_ids']

    def create(self, validated_data):
        pair_ids = validated_data.pop('pair_ids', [])
        quiz = Quiz.objects.create(**validated_data)

        for order, pair_id in enumerate(pair_ids):
            try:
                pair = MediaPair.objects.get(id=pair_id)
                QuizPair.objects.create(quiz=quiz, media_pair=pair, order=order)
            except MediaPair.DoesNotExist:
                pass

        return quiz

    def update(self, instance, validated_data):
        pair_ids = validated_data.pop('pair_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if pair_ids is not None:
            # Clear existing pairs and add new ones
            instance.quizpair_set.all().delete()
            for order, pair_id in enumerate(pair_ids):
                try:
                    pair = MediaPair.objects.get(id=pair_id)
                    QuizPair.objects.create(quiz=instance, media_pair=pair, order=order)
                except MediaPair.DoesNotExist:
                    pass

        return instance


class DashboardStatsSerializer(serializers.Serializer):
    total_categories = serializers.IntegerField()
    total_pairs = serializers.IntegerField()
    total_quizzes = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    average_score = serializers.FloatField()
    recent_sessions = serializers.ListField()
    top_pairs = serializers.ListField()

