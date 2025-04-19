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

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            return HttpResponse(status=400)

        event_type = event['type']
        data = event['data']['object']

        if event_type == 'checkout.session.completed':
            session_id = data.get("id")
            user_id = data.get("metadata", {}).get("user_id")
            mode = data.get("mode")

            # Look up or create payment record
            try:
                payment = StripePayment.objects.get(stripe_checkout_session_id=session_id)
                is_new = False
            except StripePayment.DoesNotExist:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    user = User.objects.get(id=user_id)
                except User.DoesNotExist:
                    return HttpResponse(status=404)
                payment = StripePayment(user=user, stripe_checkout_session_id=session_id)
                is_new = True

            # Basic fields
            payment.payment_type = mode
            payment.status = data.get("payment_status", payment.status)
            payment.amount = data.get("amount_total", 0) / 100
            payment.currency = data.get("currency", payment.currency)
            payment.metadata = data.get("metadata", payment.metadata)
            payment.customer_email = data.get("customer_details", {}).get("email")
            payment.customer_name = data.get("customer_details", {}).get("name")

            # Record intent and charge
            intent_id = data.get("payment_intent")
            payment.stripe_payment_intent_id = intent_id
            if intent_id:
                try:
                    intent = stripe.PaymentIntent.retrieve(intent_id)
                    # Save payment method from intent
                    payment.payment_method = intent.payment_method
                    charges = intent.charges.data
                    if charges:
                        payment.stripe_charge_id = charges[0].id
                except Exception as e:
                    print("⚠️ Failed retrieving PaymentIntent:", e)

            # Subscription ID if any
            payment.stripe_subscription_id = data.get("subscription")

            payment.save()
            print("✅ New payment created" if is_new else "✅ Payment updated", session_id)

        elif event_type == 'customer.subscription.updated':
            payment_intent_id = data.get("latest_invoice", {}).get("payment_intent")
            if payment_intent_id:
                StripePayment.objects.filter(stripe_payment_intent_id=payment_intent_id).update(
                    status=data.get("status"),
                    metadata={"current_period_end": data.get("current_period_end")}
                )
                print(f"🔄 PaymentIntent {payment_intent_id} updated to {data.get('status')}")
            else:
                print("⚠️ PaymentIntent ID not found in subscription.updated event.")

        elif event_type == 'invoice.payment_failed':
            payment_intent_id = data.get("payment_intent")
            if payment_intent_id:
                StripePayment.objects.filter(stripe_payment_intent_id=payment_intent_id).update(status="payment_failed")
                print(f"❌ Payment failed for PaymentIntent {payment_intent_id}")
            else:
                print("⚠️ PaymentIntent ID not found in payment_failed event.")

            sub_id = data.get("subscription")
            if sub_id:
                try:
                    stripe.Subscription.delete(sub_id)
                    print(f"🗑️ Subscription {sub_id} cancelled.")
                except Exception as e:
                    print("⚠️ Failed cancelling subscription:", e)

        else:
            print(f"⚠️ Unhandled event type: {event_type}")

        return HttpResponse(status=200)
