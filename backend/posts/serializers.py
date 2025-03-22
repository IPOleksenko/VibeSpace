from rest_framework import serializers
from .models import Post
from AWS.S3.serializers import UserMediaSerializer

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'text', 'user', 'media', 'uploaded_at']
        read_only_fields = ['user']

class PostReadSerializer(serializers.ModelSerializer):
    media = UserMediaSerializer(many=True, allow_null=True, required=False, read_only=True)

    class Meta:
        model = Post
        fields = "__all__"
