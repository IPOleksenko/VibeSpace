from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ChatMessage
from .serializers import ChatMessageSerializer, ChatMessageReadSerializer
from AWS.S3.models import UserMedia
from AWS.S3.views import S3FileUploadView  
from chats.views import Chat

class ChatMessageCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Create a copy of text data only, files are handled separately
        data = request.POST.copy()
        data["user"] = request.user.id

        chat_id = data.get("chat")
        chat = get_object_or_404(Chat, id=chat_id)

        # Check access to the chat
        if not chat.users.filter(id=request.user.id).exists():
            print(f"Attempt to send without access: {request.user.username} (ID: {request.user.id})")
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        print("Received data:", data)
        print("Files in request:", request.FILES)

        # Check if a file is present in the request
        file_obj = request.FILES.get("file")
        if file_obj:
            print(f"File received: {file_obj.name}, size: {file_obj.size} bytes")

            # Upload file via S3FileUploadView
            file_request = request._request
            file_request.data = {"file": file_obj}

            upload_view = S3FileUploadView()
            response = upload_view.post(file_request)

            print("Response from S3:", response.data)

            if response.status_code == status.HTTP_201_CREATED:
                media_id = response.data.get("data", {}).get("id")
                if media_id:
                    data["media"] = media_id
                    print("media_id after upload:", media_id)
                else:
                    return Response({"error": "Error: media_id not received"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "File upload error to S3"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the message
        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            chat_message = serializer.save()
            print("Message successfully saved:", serializer.data)
            return Response(ChatMessageSerializer(chat_message).data, status=status.HTTP_201_CREATED)

        print("Serialization error:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatMessagesListView(ListAPIView):
    serializer_class = ChatMessageReadSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        chat_id = self.kwargs.get("chat_id")
        user = self.request.user

        allowed_chats = Chat.objects.filter(users=user)

        if not allowed_chats.filter(id=chat_id).exists():
            return Response({"detail": "Access to the chat is not allowed."}, status=status.HTTP_200_OK)

        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        chat_id = self.kwargs.get("chat_id")
        return ChatMessage.objects.filter(chat_id=chat_id).order_by("uploaded_at")
