import boto3
import os
import uuid
import mimetypes
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import UserMedia
from .serializers import UserMediaSerializer
from django.core.files.base import ContentFile
from django.utils.timezone import now

class S3FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        if "file" not in request.FILES:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        title = request.data.get("title", file.name[:100])
        file_extension = os.path.splitext(file.name)[1].lower().lstrip(".")  # Remove the dot
        
        # If the extension is unknown, use "unknown"
        folder = file_extension if file_extension else "unknown"
        
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        s3_key = f"{folder}/{unique_filename}"
        
        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )

            file_content = file.read()
            s3.upload_fileobj(ContentFile(file_content), settings.AWS_STORAGE_BUCKET_NAME, s3_key)

            file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

            media = UserMedia.objects.create(title=title, file=s3_key, uploaded_at=now())
            serializer = UserMediaSerializer(media)

            return Response({
                "message": "File uploaded successfully",
                "file_url": file_url,
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class S3FileGetView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        file_id = request.query_params.get("id")
        if not file_id:
            return Response({"error": "ID parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            media = UserMedia.objects.get(id=file_id)
        except UserMedia.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        s3_key = str(media.file.name) if hasattr(media.file, "name") else str(media.file)
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )

        try:
            s3_response = s3.get_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
            file_stream = s3_response["Body"]
            content_type = s3_response.get("ContentType") or mimetypes.guess_type(s3_key)[0] or "application/octet-stream"

            return StreamingHttpResponse(file_stream, content_type=content_type)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class S3FileDeleteView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, *args, **kwargs):
        file_id = request.query_params.get("id")
        if not file_id:
            return Response({"error": "ID parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            media = UserMedia.objects.get(id=file_id)
        except UserMedia.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        s3_key = media.file.name if hasattr(media.file, "name") else media.file
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        try:
            s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=s3_key)
            media.delete()
            return Response({"message": "File deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
