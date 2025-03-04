import base64
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UserProfile
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
import base64
from .models import UserProfile

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = ["username", "email", "password", "confirm_password", "phone_number", "avatar"]

    def validate(self, data):
        # Check if the passwords match
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")  # Delete before saving
        avatar_file = validated_data.pop("avatar", None)

        if avatar_file:
            validated_data["avatar_base64"] = base64.b64encode(avatar_file.read()).decode("utf-8")

        validated_data["password"] = make_password(validated_data["password"])
        return UserProfile.objects.create(**validated_data)
