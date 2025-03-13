from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import ChatMessage
from .serializers import ChatMessageSerializer, ChatMessageReadSerializer
from AWS.S3.models import UserMedia
from AWS.S3.views import S3FileUploadView  

class ChatMessageCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data["user"] = request.user.id  

        print("Received data:", data)
        print("Files in request:", request.FILES)

        # Check if there is a file in the request
        if "file" in request.FILES:
            file_obj = request.FILES["file"]
            print(f"File received: {file_obj.name}, size: {file_obj.size} bytes")

            # Create a new request containing only the file
            file_request = request._request
            file_request.data = {"file": file_obj}

            # Upload the file using S3FileUploadView
            upload_view = S3FileUploadView()
            response = upload_view.post(file_request)

            print("Response from S3:", response.data)

            # Check if the file was successfully uploaded
            if response.status_code == status.HTTP_201_CREATED:
                media_id = response.data.get("data", {}).get("id")
                if media_id:
                    data["media"] = media_id
                    print("media_id after upload:", media_id)
                else:
                    return Response({"error": "Error: media_id not received"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "File upload to S3 failed"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the message in the database
        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            chat_message = serializer.save()
            print("Successfully saved:", serializer.data)
            return Response(ChatMessageSerializer(chat_message).data, status=status.HTTP_201_CREATED)

        print("Serialization errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChatMessagesListView(ListAPIView):
    serializer_class = ChatMessageReadSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        chat_id = self.kwargs.get("chat_id")
        return ChatMessage.objects.filter(chat_id=chat_id).order_by("uploaded_at")
