from rest_framework import serializers
from .models import ChatMessage
from AWS.S3.models import UserMedia
from AWS.S3.serializers import UserMediaSerializer

class ChatMessageSerializer(serializers.ModelSerializer):
    media = serializers.PrimaryKeyRelatedField(queryset=UserMedia.objects.all(), allow_null=True, required=False)

    class Meta:
        model = ChatMessage
        fields = "__all__"

class ChatMessageReadSerializer(serializers.ModelSerializer):
    media = UserMediaSerializer(allow_null=True, required=False, read_only=True)

    class Meta:
        model = ChatMessage
        fields = "__all__"