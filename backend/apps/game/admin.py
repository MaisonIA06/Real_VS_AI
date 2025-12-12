"""
Django admin configuration for game models.
"""
from django.contrib import admin
from .models import Category, MediaPair, Quiz, QuizPair, GameSession, GameAnswer, GlobalStats


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


class QuizPairInline(admin.TabularInline):
    model = QuizPair
    extra = 1


@admin.register(MediaPair)
class MediaPairAdmin(admin.ModelAdmin):
    list_display = ['id', 'category', 'media_type', 'difficulty', 'is_active', 'created_at']
    list_filter = ['category', 'media_type', 'difficulty', 'is_active']
    search_fields = ['hint']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_random', 'is_active', 'created_at']
    list_filter = ['is_random', 'is_active']
    search_fields = ['name', 'description']
    inlines = [QuizPairInline]


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['session_key', 'pseudo', 'quiz', 'score', 'streak_max', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'quiz']
    search_fields = ['pseudo', 'session_key']
    readonly_fields = ['session_key', 'created_at']


@admin.register(GameAnswer)
class GameAnswerAdmin(admin.ModelAdmin):
    list_display = ['session', 'media_pair', 'is_correct', 'response_time_ms', 'points_earned', 'order']
    list_filter = ['is_correct']


@admin.register(GlobalStats)
class GlobalStatsAdmin(admin.ModelAdmin):
    list_display = ['media_pair', 'total_attempts', 'correct_answers', 'success_rate']
    readonly_fields = ['total_attempts', 'correct_answers']

