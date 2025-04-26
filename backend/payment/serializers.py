from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    subscription_period_days = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'type',
            'subscription_period_days'
        ]

    def get_subscription_period_days(self, obj):
        return obj.subscription_period.days if obj.subscription_period else None
