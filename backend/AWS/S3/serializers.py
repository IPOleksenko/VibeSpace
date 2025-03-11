from rest_framework import serializers
from django.conf import settings
from .models import UserMedia

class UserMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = UserMedia
        fields = ['id', 'title', 'file', 'file_url', 'uploaded_at']

    def get_file_url(self, obj):
        return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{obj.file}"

