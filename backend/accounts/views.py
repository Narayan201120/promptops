from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer, LoginSerializer
from .models import User


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        print(f"Login request data: {request.data}")  # Debug logging
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")  # Debug logging
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        print(f"Authenticating user: {email}")  # Debug logging
        
        # Authenticate user
        user = authenticate(request, username=email, password=password)
        
        if user is None:
            print(f"Authentication failed for: {email}")  # Debug logging
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    """Authenticate with Google OAuth ID token"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        from decouple import config
        from prompts.models import Tenant
        
        token = request.data.get('token')
        
        if not token:
            return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify Google token
            client_id = config('GOOGLE_OAUTH_CLIENT_ID', default='')
            
            if not client_id:
                return Response({
                    'error': 'Google OAuth not configured'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Verify token with clock skew tolerance
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
                clock_skew_in_seconds=10  # Allow 10 seconds clock skew
            )
            
            # Get user info from Google
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            if not email:
                return Response({
                    'error': 'Email not provided by Google'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            # Create tenant for new users
            if created and not user.tenant:
                tenant = Tenant.objects.create(
                    name=f"{email.split('@')[0]}'s Workspace"
                )
                user.tenant = tenant
                user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({
                'error': f'Invalid token: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': f'Authentication failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
