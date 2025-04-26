import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import StripePayment, Product
from .serializers import ProductSerializer

class CheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        if StripePayment.objects.filter(user=request.user, status__in=["paid", "active"]).exists():
            return Response({"error": "You already have an active payment."}, status=status.HTTP_403_FORBIDDEN)

        product_id = request.data.get("product_id")

        if not product_id:
            return Response({"error": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        mode = "payment" if product.type == "one_time" else "subscription"

        try:
            session = stripe.checkout.Session.create(
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
                line_items=[{
                    "price": product.stripe_price_id,
                    "quantity": 1
                }],
                mode=mode,
                customer_email=request.user.email,
                metadata={
                    "user_id": str(request.user.id),
                    "product_id": str(product.id),
                    "product_type": product.type
                }
            )
            return Response({"url": session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, user_id, *args, **kwargs):
        user = get_object_or_404(get_user_model(), id=user_id)
        
        subscription = StripePayment.objects.filter(
            user=user,
            status__in=["paid", "active"]
        ).exists()

        if subscription:
            return Response({"has_subscription": True})
        else:
            return Response({"has_subscription": False})

class CancelSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        user = request.user

        # Get all active subscriptions and payments for the user
        subscriptions = StripePayment.objects.filter(
            user=user,
            status__in=["paid", "active"]
        )

        if not subscriptions.exists():
            return Response({"message": "No active subscriptions."}, status=status.HTTP_404_NOT_FOUND)

        canceled = []
        errors = []

        for subscription in subscriptions:
            if subscription.payment_type == "payment":
                # If the subscription is a one-time payment, add an error to the list but don't interrupt the loop
                errors.append(f"Subscription with payment type 'payment' (ID: {subscription.id}) cannot be canceled.")
                continue  # Move to the next subscription

            try:
                # Cancel the subscription in Stripe
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
                # Update the subscription status in our database
                subscription.status = "canceled"
                subscription.save()
                canceled.append(subscription.id)

            except stripe.error.StripeError as e:
                # If an error occurs while canceling, add it to the error list
                errors.append(f"Failed to cancel subscription {subscription.id}: {str(e)}")

        if canceled:
            return Response(
                {"message": f"Subscriptions {canceled} successfully canceled."},
                status=status.HTTP_200_OK
            )
        else:
            # If no subscriptions were successfully canceled, return an error
            return Response(
                {"message": "Failed to cancel subscriptions. Errors: " + " | ".join(errors)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProductListView(APIView):
    def get(self, request, *args, **kwargs):
        try:
            # Retrieve all products
            products = Product.objects.all()

            # If products exist, return their serialized data
            if products.exists():
                serializer = ProductSerializer(products, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # If no products are available, return 404 with a message
                return Response({"message": "No products available"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            # In case of a server error
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)