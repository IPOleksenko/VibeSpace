from rest_framework import status, parsers
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer
from .models import UserProfile

class RegisterUserView(APIView):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        print(f"Received login attempt: username={username}, password={password}")

        try:
            user = UserProfile.objects.get(username=username)
            print(f"User found: {user}")

            if user.check_password(password):
                token, created = Token.objects.get_or_create(user=user)
                print(f"Authentication successful! Token: {token.key}")
                return Response({"token": token.key, "user_id": user.id}, status=status.HTTP_200_OK)
            else:
                print("Password check failed!")

        except UserProfile.DoesNotExist:
            print("User not found!")

        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "avatar_base64": user.avatar_base64
        })