import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
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

WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET
stripe.api_key = settings.STRIPE_SECRET_KEY

class CheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
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

        # Check for active payments
        if StripePayment.objects.filter(user=request.user, status="paid").exists():
            return Response({"error": "You already have an active payment."}, status=status.HTTP_403_FORBIDDEN)

        try:
            session = stripe.checkout.Session.create(
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
                metadata={
                    "user_id": str(request.user.id),
                    "payment_type": mode
                }
            )

            return Response({"url": session.url})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return HttpResponse(status=400)

        event_type = event['type']
        data_object = event['data']['object']

        if event_type == 'checkout.session.completed':
            session_id = data_object.get("id")
            user_id = data_object.get("metadata", {}).get("user_id")

            try:
                payment = StripePayment.objects.get(stripe_checkout_session_id=session_id)
                is_new = False
            except StripePayment.DoesNotExist:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    print("❌ User not found for ID:", user_id)
                    return HttpResponse(status=404)

                payment = StripePayment(
                    user=user,
                    stripe_checkout_session_id=session_id,
                    payment_type=data_object.get("mode"),
                )
                is_new = True

            payment.status = data_object.get("payment_status", payment.status)
            payment.amount = data_object.get("amount_total", 0) / 100
            payment.currency = data_object.get("currency", payment.currency)
            payment.metadata = data_object.get("metadata", payment.metadata)
            payment.customer_email = data_object.get("customer_email")
            payment.customer_name = data_object.get("customer_details", {}).get("name")
            payment.payment_method = data_object.get("payment_method")
            payment.stripe_subscription_id = data_object.get("subscription")

            # Get charge ID
            payment_intent_id = data_object.get("payment_intent")
            if payment_intent_id:
                try:
                    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                    charges = intent.get("charges", {}).get("data", [])
                    if charges:
                        payment.stripe_charge_id = charges[0].get("id")
                except Exception as e:
                    print("⚠️ Failed to retrieve PaymentIntent:", e)

            payment.save()
            print("✅ Payment created" if is_new else "✅ Payment updated:", session_id)

        elif event_type == 'customer.subscription.updated':
            subscription_id = data_object.get("id")
            status = data_object.get("status")
            current_period_end = data_object.get("current_period_end")

            StripePayment.objects.filter(stripe_subscription_id=subscription_id).update(
                status=status,
                metadata={"current_period_end": current_period_end}
            )
            print(f"🔄 Subscription updated: {subscription_id}, status: {status}")

        elif event_type == 'invoice.payment_failed':
            subscription_id = data_object.get("subscription")

            StripePayment.objects.filter(stripe_subscription_id=subscription_id).update(
                status="payment_failed"
            )
            print(f"❌ Payment failed for subscription: {subscription_id}")

            try:
                stripe.Subscription.delete(subscription_id)
                print(f"🗑️ Subscription {subscription_id} cancelled due to failed payment.")
            except Exception as e:
                print(f"⚠️ Failed to cancel subscription {subscription_id}: {e}")

        else:
            print(f"⚠️ Unhandled event type {event_type}")

        return HttpResponse(status=200)
