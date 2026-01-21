from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, UserProfileView, GoogleAuthView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh_alias'),  # Alias for frontend
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
]
