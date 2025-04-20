import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import StripePayment

# Direct price identifiers
ONE_TIME_PAYMENT_PRICE_ID = settings.ONE_TIME_PAYMENT_PRICE_ID
ONE_WEEK_SUBSCRIPTION_PRICE_ID = settings.ONE_WEEK_SUBSCRIPTION_PRICE_ID
ONE_MONTH_SUBSCRIPTION_PRICE_ID = settings.ONE_MONTH_SUBSCRIPTION_PRICE_ID

class CheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        # Prevent multiple active payments
        if StripePayment.objects.filter(user=request.user, status__in=["paid", "active"]).exists():
            return Response({"error": "You already have an active payment."}, status=status.HTTP_403_FORBIDDEN)

        
        data = request.data
        option = data.get("option")

        if option == "one_time":
            price_id = ONE_TIME_PAYMENT_PRICE_ID
            mode = "payment"
        elif option == "one_week":
            price_id = ONE_WEEK_SUBSCRIPTION_PRICE_ID
            mode = "subscription"
        elif option == "one_month":
            price_id = ONE_MONTH_SUBSCRIPTION_PRICE_ID
            mode = "subscription"
        else:
            return Response({"error": "Invalid option"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = stripe.checkout.Session.create(
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
                customer_email=request.user.email,
                metadata={"user_id": str(request.user.id)}
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
