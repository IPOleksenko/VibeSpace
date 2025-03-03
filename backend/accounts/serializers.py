import base64
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.FileField(required=False)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        avatar_file = validated_data.pop('avatar', None)
        password = validated_data.pop('password')
        
        if avatar_file:
            # Convert Avatar to Base64
            avatar_data = base64.b64encode(avatar_file.read()).decode('utf-8')
            validated_data['avatar'] = avatar_data
        
        # Hashing a password with make_password
        validated_data['password'] = make_password(password)
        
        user = UserProfile.objects.create(**validated_data)
        return user
