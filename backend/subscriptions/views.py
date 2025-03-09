from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import UserSubscriptionSerializer
from .models import UserSubscription

class SubscriptionView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a subscription"""
        subscribed_to_id = request.data.get("subscribed_to")
        if not subscribed_to_id:
            return Response({"error": "Missing 'subscribed_to' parameter"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSubscriptionSerializer(data={
            "subscriber": request.user.id,
            "subscribed_to": subscribed_to_id
        })
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Subscription added successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Check subscription status between users"""
        subscribed_to_id = request.query_params.get("subscribed_to")
        if not subscribed_to_id:
            return Response({"error": "Missing 'subscribed_to' parameter"}, status=status.HTTP_400_BAD_REQUEST)

        is_subscribed = UserSubscription.objects.filter(subscriber=request.user, subscribed_to_id=subscribed_to_id).exists()
        is_subscribed_back = UserSubscription.objects.filter(subscriber_id=subscribed_to_id, subscribed_to=request.user).exists()

        return Response({
            "is_subscribed": is_subscribed,         # Whether the current user is subscribed to another user
            "is_subscribed_back": is_subscribed_back  # Whether the other user is subscribed to the current user
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Delete a subscription"""
        subscribed_to_id = request.data.get("subscribed_to")
        if not subscribed_to_id:
            return Response({"error": "Missing 'subscribed_to' parameter"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            subscription = UserSubscription.objects.get(subscriber=request.user, subscribed_to_id=subscribed_to_id)
            subscription.delete()
            return Response({"message": "Subscription deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except UserSubscription.DoesNotExist:
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)
