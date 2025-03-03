import base64
import re
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'password', 'confirm_password', 'phone', 'avatar']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        """ Email uniqueness check """
        if UserProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_username(self, value):
        """ Username uniqueness check """
        if UserProfile.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_phone(self, value):
        """ Phone number validation """
        if not re.fullmatch(r'^\+?\d{10,15}$', value):
            raise serializers.ValidationError("Invalid phone number format. It must contain only digits and be 10-15 characters long.")
        return value

    def validate(self, data):
        """ General validation: check password and confirm_password """
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        if len(data['password']) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        return data

    def create(self, validated_data):
        """ Remove confirm_password and hash the password before saving """
        validated_data.pop('confirm_password')
        validated_data['password'] = make_password(validated_data['password'])

        avatar = validated_data.pop('avatar', None)
        user = UserProfile.objects.create(**validated_data)

        if avatar:
            user.set_avatar_from_file(avatar)

        return user

    def update(self, instance, validated_data):
        """ Update user instance and handle avatar conversion """
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])

        avatar = validated_data.pop('avatar', None)
        instance = super().update(instance, validated_data)

        if avatar:
            instance.set_avatar_from_file(avatar)

        return instance
