from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# JWT views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.throttling import AnonRateThrottle
from users.serializers import EmailTokenObtainPairSerializer
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


class LoginRateThrottle(AnonRateThrottle):
    """
    R13-S1/B2: brute-force защита на /auth/token/.
    Default `anon` throttle = 60/min — слишком много для логина (60 попыток
    подобрать пароль в минуту). Этот scope ограничивает 10/min на endpoint.
    """
    scope = 'login'


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [LoginRateThrottle]


urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth Endpoints (JWT) с rate-limit для защиты от brute-force
    path('api/v1/auth/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),

    # App Endpoints
    path('api/v1/users/', include('users.urls')),
    path('api/v1/', include('posts.urls')),

    # OpenAPI / Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Media URL serving for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
