"""
Models for the Real vs AI game.
"""
import uuid
from django.db import models


class Category(models.Model):
    """Category for grouping media pairs (e.g., Landscapes, Portraits, Animals)."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class MediaPair(models.Model):
    """A pair of media: one real, one AI-generated. Or a single audio file."""
    
    class MediaType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Vidéo'
        AUDIO = 'audio', 'Audio'

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Facile'
        MEDIUM = 'medium', 'Moyen'
        HARD = 'hard', 'Difficile'

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='media_pairs'
    )
    # For image/video: both required. For audio: only audio_media and is_real
    real_media = models.FileField(upload_to='pairs/real/', null=True, blank=True)
    ai_media = models.FileField(upload_to='pairs/ai/', null=True, blank=True)
    # For audio type: single audio file
    audio_media = models.FileField(upload_to='pairs/audio/', null=True, blank=True)
    # For audio: indicates if the audio is real (True) or AI-generated (False)
    is_real = models.BooleanField(
        null=True,
        blank=True,
        help_text="Pour audio: True si réel, False si IA"
    )
    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.IMAGE
    )
    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM
    )
    hint = models.TextField(
        blank=True,
        help_text="Explication affichée après la réponse"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.category.name} - {self.media_type} #{self.id}"


class Quiz(models.Model):
    """A custom quiz with selected media pairs."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_random = models.BooleanField(
        default=False,
        help_text="Si activé, pioche aléatoirement dans toutes les paires actives"
    )
    pairs = models.ManyToManyField(
        MediaPair,
        through='QuizPair',
        related_name='quizzes',
        blank=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Quizzes"
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class QuizPair(models.Model):
    """Intermediate model for Quiz-MediaPair relationship with ordering."""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    media_pair = models.ForeignKey(MediaPair, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['quiz', 'media_pair']


class GameSession(models.Model):
    """A game session for a player."""
    session_key = models.UUIDField(default=uuid.uuid4, unique=True)
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='game_sessions'
    )
    pseudo = models.CharField(max_length=50, blank=True)
    score = models.IntegerField(default=0)
    streak_max = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    time_total_ms = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.session_key} - {self.pseudo or 'Anonyme'}"


class GameAnswer(models.Model):
    """An answer submitted during a game session."""
    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    media_pair = models.ForeignKey(
        MediaPair,
        on_delete=models.CASCADE,
        related_name='game_answers'
    )
    is_correct = models.BooleanField()
    response_time_ms = models.IntegerField()
    order = models.PositiveIntegerField()
    points_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = ['session', 'order']

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} Q{self.order} - {self.session.session_key}"


class GlobalStats(models.Model):
    """Global statistics for each media pair."""
    media_pair = models.OneToOneField(
        MediaPair,
        on_delete=models.CASCADE,
        related_name='global_stats'
    )
    total_attempts = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Global stats"

    def __str__(self):
        return f"Stats for MediaPair #{self.media_pair.id}"

    @property
    def success_rate(self):
        if self.total_attempts == 0:
            return 0
        return round((self.correct_answers / self.total_attempts) * 100, 1)

