from rest_framework import serializers
from .models import UserSubscription

class UserSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSubscription
        fields = "__all__"
    
    def validate(self, attrs):
        if attrs.get('subscriber') == attrs.get('subscribed_to'):
            raise serializers.ValidationError("A user cannot subscribe to themselves.")
        return attrs
