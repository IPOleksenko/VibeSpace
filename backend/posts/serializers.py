from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'text', 'user', 'media', 'uploaded_at']
        read_only_fields = ['user']
