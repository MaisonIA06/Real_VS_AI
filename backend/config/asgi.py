"""
ASGI config for Real vs AI project.
Supports both HTTP and WebSocket protocols.
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
django_asgi_app = get_asgi_application()

# Import routing after Django setup
from apps.game.routing import websocket_urlpatterns

# Note: AllowedHostsOriginValidator removed to allow WebSocket connections
# from mobile devices on LAN (different IPs/origins)
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

