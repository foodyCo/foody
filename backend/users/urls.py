from django.urls import path
from .views import UserRegistrationView, MeView, UserDetailView, SubscribeView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('me/', MeView.as_view(), name='user-me'),
    path('<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('<int:user_id>/subscribe/', SubscribeView.as_view(), name='user-subscribe'),
]
