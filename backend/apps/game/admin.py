"""
Django admin configuration for game models.
"""
from django.contrib import admin
from .models import Category, MediaPair, GameSession, GameAnswer, GlobalStats


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


@admin.register(MediaPair)
class MediaPairAdmin(admin.ModelAdmin):
    list_display = ['id', 'category', 'media_type', 'difficulty', 'is_active', 'created_at']
    list_filter = ['category', 'media_type', 'difficulty', 'is_active']
    search_fields = ['hint']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['session_key', 'pseudo', 'score', 'streak_max', 'is_completed', 'created_at']
    list_filter = ['is_completed']
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

