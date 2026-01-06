"""
URL patterns for the game API.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.GameSessionView.as_view(), name='session-create'),
    path('sessions/<uuid:session_key>/answer/', views.AnswerSubmitView.as_view(), name='answer-submit'),
    path('sessions/<uuid:session_key>/result/', views.GameResultView.as_view(), name='game-result'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('secret-quiz/', views.SecretQuizView.as_view(), name='secret-quiz'),
    
    # Multiplayer / Live Mode
    path('multiplayer/rooms/', views.MultiplayerRoomCreateView.as_view(), name='multiplayer-room-create'),
    path('multiplayer/rooms/<str:room_code>/', views.MultiplayerRoomDetailView.as_view(), name='multiplayer-room-detail'),
    path('local-ip/', views.LocalIPView.as_view(), name='local-ip'),
]

