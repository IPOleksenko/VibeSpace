from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Chat

User = get_user_model()

class ChatSerializer(serializers.ModelSerializer):
    users = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True)

    class Meta:
        model = Chat
        fields = ['id', 'users', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        users = validated_data.pop('users')
        chat, created = Chat.get_or_create(users=users)
        return chat
