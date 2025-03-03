from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserProfileSerializer

@api_view(['POST'])
def register_user(request):
    """ API for creating a user """
    serializer = UserProfileSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)

    return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
