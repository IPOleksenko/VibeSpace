import stripe
import json
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
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

        try:
            session = stripe.checkout.Session.create(
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
                line_items=[{"price": price_id, "quantity": 1}],
                mode=mode,
            )

            StripePayment.objects.create(
                user=request.user,
                stripe_checkout_session_id=session["id"],
                payment_type=session["mode"],
                amount=session["amount_total"] / 100,
                currency=session["currency"],
                status=session["payment_status"],
                metadata=session.get("metadata", {}),
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
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            session_id = session.get("id")

            try:
                payment = StripePayment.objects.get(stripe_checkout_session_id=session_id)
                
                payment.status = session.get("payment_status", payment.status)
                payment.amount = session.get("amount_total", payment.amount) / 100
                payment.currency = session.get("currency", payment.currency)
                payment.metadata = session.get("metadata", payment.metadata)
                payment.save()

                print("✅ Payment updated:", session_id)

            except StripePayment.DoesNotExist:
                print("❌ Payment with session ID not found:", session_id)
                return HttpResponse(status=404)

        elif event['type'] == 'payment_method.attached':
            print("💳 PaymentMethod attached!")

        else:
            print(f"⚠️ Unhandled event type {event['type']}")

        return HttpResponse(status=200)
