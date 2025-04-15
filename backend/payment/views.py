import stripe
import json
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

# Direct price identifiers
ONE_TIME_PAYMENT_PRICE_ID = settings.ONE_TIME_PAYMENT_PRICE_ID
ONE_WEEK_SUBSCRIPTION_PRICE_ID = settings.ONE_WEEK_SUBSCRIPTION_PRICE_ID
ONE_MONTH_SUBSCRIPTION_PRICE_ID = settings.ONE_MONTH_SUBSCRIPTION_PRICE_ID

WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET
stripe.api_key = settings.STRIPE_SECRET_KEY

@method_decorator(csrf_exempt, name='dispatch')
class CheckoutSessionView(View):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

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
            return JsonResponse({"error": "Invalid option"}, status=400)

        try:
            session = stripe.checkout.Session.create(
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse({"url": session.url})

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, WEBHOOK_SECRET
            )
        except ValueError:
            # Invalid JSON
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            # Invalid signature
            return HttpResponse(status=400)

        # Handling Stripe events
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Logic for handling successful payment
            print("💰 PaymentIntent was successful!", payment_intent)
        elif event['type'] == 'payment_method.attached':
            payment_method = event['data']['object']
            # Logic for attaching payment method
            print("💳 PaymentMethod attached!", payment_method)
        else:
            print(f"Unhandled event type {event['type']}")

        return HttpResponse(status=200)
