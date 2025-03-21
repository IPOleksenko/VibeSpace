from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import QueryDict

from .models import Post
from AWS.S3.models import UserMedia
from AWS.S3.views import S3FileUploadView
from .serializers import PostSerializer


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
                        return Response({"error": f"Media with ID {media_id} not found"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": "Error: media_id not received"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Error uploading file to S3"}, status=status.HTTP_400_BAD_REQUEST)

        if media_objects:
            post.media.add(*media_objects)

        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
