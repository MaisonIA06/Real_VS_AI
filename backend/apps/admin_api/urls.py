"""
URL patterns for the admin API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'media-pairs', views.MediaPairViewSet)
router.register(r'quizzes', views.QuizViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.dashboard_stats, name='dashboard-stats'),
    path('sessions/<int:session_id>/', views.delete_session, name='delete-session'),
]

