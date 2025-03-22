from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import ListAPIView
from django.http import QueryDict
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import magic

from .models import Post
from subscriptions.models import UserSubscription 
from AWS.S3.models import UserMedia
from AWS.S3.views import S3FileUploadView
from .serializers import PostSerializer, PostReadSerializer

User = get_user_model()

class PostCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print("DEBUG POST DATA:", request.POST)
        print("DEBUG FILES:", request.FILES)

        text = request.data.get('text', '')
        files = request.FILES.getlist('files')

        post = Post.objects.create(user=request.user, text=text)

        media_objects = []

        for file_obj in files:
            print(f"Uploading file: {file_obj.name}")

            file_header = file_obj.read(2048)
            file_obj.seek(0)
            detected_mime = magic.from_buffer(file_header, mime=True)
            print(f"Detected MIME type: {detected_mime}")

            if file_obj.content_type.startswith("image/"):
                if not detected_mime.startswith("image/"):
                    return Response(
                        {"error": "Uploaded file is not a valid image."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif file_obj.content_type.startswith("video/"):
                if not detected_mime.startswith("video/"):
                    return Response(
                        {"error": "Uploaded file is not a valid video."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "Uploaded file must be an image or video."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            upload_request = request._request
            upload_request.POST = QueryDict(mutable=True)
            upload_request.POST.update({'title': file_obj.name})
            upload_request.FILES['file'] = file_obj

            upload_view = S3FileUploadView.as_view()
            response = upload_view(upload_request)

            print("Response from S3FileUploadView:", response.data)

            if response.status_code == status.HTTP_201_CREATED:
                media_id = response.data.get("data", {}).get("id")
                if media_id:
                    try:
                        media = UserMedia.objects.get(id=media_id)
                        media_objects.append(media)
                    except UserMedia.DoesNotExist:
                        return Response(
                            {"error": f"Media with ID {media_id} not found"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    return Response(
                        {"error": "Error: media_id not received"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "Error uploading file to S3"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if media_objects:
            post.media.add(*media_objects)

        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserPostsView(ListAPIView):
    serializer_class = PostReadSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.GET.get("user_id")
        if user_id is not None:
            try:
                user_id = int(user_id)
                user = get_object_or_404(User, id=user_id)
                return Post.objects.filter(user=user).order_by("uploaded_at")
            except ValueError:
                pass
        return Post.objects.none()
    
class SubscribedUsersPostsView(ListAPIView):
    serializer_class = PostReadSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_profile = self.request.user
        subscribed_users = UserSubscription.objects.filter(subscriber=user_profile).values_list("subscribed_to", flat=True)
        return Post.objects.filter(user__in=subscribed_users).order_by("-uploaded_at")
