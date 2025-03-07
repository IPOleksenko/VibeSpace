from rest_framework import status, parsers
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserProfileSerializer
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

        try:
            user = UserProfile.objects.get(username=username)
            print(f"User found: {user}")

            if not user.is_active:
                print("User is inactive!")
                return Response({"error": "Your account is inactive. Please contact support."}, status=status.HTTP_403_FORBIDDEN)

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

class UserSearchView(APIView):
    def get(self, request):
        query = request.GET.get('query', None)
        if not query:
            return Response({"error": "The 'query' parameter is not provided."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if query.isdigit():
                try:
                    user = UserProfile.objects.get(id=query)
                    serializer = UserProfileSerializer(user)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except UserProfile.DoesNotExist:
                    return Response({"error": "User with this ID was not found."}, status=status.HTTP_404_NOT_FOUND)
            else:
                users = UserProfile.objects.filter(username__icontains=query)
                if users.exists():
                    serializer = UserProfileSerializer(users, many=True)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "User with this username was not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "Error: " + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetUserByIdView(APIView):
    def get(self, request, id):
        try:
            user = UserProfile.objects.get(id=id)
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "User with this ID was not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
