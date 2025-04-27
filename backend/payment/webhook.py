import stripe
from django.http import HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import StripePayment

WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

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
            return self.handle_checkout_session_completed(data)
        elif event_type == 'customer.subscription.updated':
            return self.handle_subscription_updated(data)
        elif event_type == 'customer.subscription.deleted':
            return self.handle_subscription_deleted(data)
        elif event_type == 'invoice.created':
            return self.handle_invoice_created(data)
        elif event_type == 'charge.updated':
            return self.handle_charge_updated(data)
        else:
            print(f"⚠️ Unhandled event type: {event_type}")

        return HttpResponse(status=200)

    def handle_checkout_session_completed(self, data):
        session_id = data.get("id")
        user_id = data.get("metadata", {}).get("user_id")
        mode = data.get("mode")

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            payment = StripePayment.objects.get(stripe_checkout_session_id=session_id)
            is_new = False
        except StripePayment.DoesNotExist:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return HttpResponse(status=404)
            payment = StripePayment(user=user, stripe_checkout_session_id=session_id)
            is_new = True

        payment.payment_type = mode
        payment.status = data.get("payment_status", payment.status)
        payment.amount = data.get("amount_total", 0) / 100
        payment.currency = data.get("currency", payment.currency)
        payment.metadata = data.get("metadata", payment.metadata)
        payment.customer_email = data.get("customer_details", {}).get("email")
        payment.customer_name = data.get("customer_details", {}).get("name")

        intent_id = data.get("payment_intent")
        payment.stripe_payment_intent_id = intent_id
        if intent_id:
            try:
                intent = stripe.PaymentIntent.retrieve(intent_id)
                payment.payment_method = intent.payment_method
                charges = intent.charges.data
                if charges:
                    payment.stripe_charge_id = charges[0].id
            except Exception as e:
                print("⚠️ Failed retrieving PaymentIntent:", e)

        payment.stripe_subscription_id = data.get("subscription")

        payment.save()
        print("✅ New payment created" if is_new else "✅ Payment updated", session_id)

        return HttpResponse(status=200)

    def handle_subscription_updated(self, data):
        stripe_subscription_id = data.get("id")
        if stripe_subscription_id:
            try:
                payment = StripePayment.objects.get(stripe_subscription_id=stripe_subscription_id)
                # Update the status and metadata
                payment.status = data.get("status")
                payment.metadata = {"current_period_end": data.get("current_period_end")}
                payment.save()
                print(f"🔄 Subscription {stripe_subscription_id} updated to {data.get('status')}")
            except StripePayment.DoesNotExist:
                print(f"⚠️ Payment with subscription ID {stripe_subscription_id} not found.")
        else:
            print("⚠️ Subscription ID not found in subscription.updated event.")
        
        return HttpResponse(status=200)

    def handle_subscription_deleted(self, data):
        stripe_subscription_id = data.get("id")
        
        if stripe_subscription_id:
            try:
                payment = StripePayment.objects.get(stripe_subscription_id=stripe_subscription_id)
                
                # Update status to "canceled"
                payment.status = "canceled"
                
                payment.metadata = {"subscription_canceled": True, "canceled_at": data.get("ended_at")}
                
                payment.save()
                
                print(f"🔴 Subscription {stripe_subscription_id} was canceled.")
            except StripePayment.DoesNotExist:
                print(f"⚠️ Payment with subscription ID {stripe_subscription_id} not found.")
        else:
            print("⚠️ Subscription ID not found in subscription.deleted event.")
        
        return HttpResponse(status=200)

    def handle_invoice_created(self, data):
        subscription_id = data.get('subscription')
        payment_intent_id = data.get('payment_intent')
        invoice_url = data.get('hosted_invoice_url')

        payment = None

        if subscription_id:
            try:
                payment = StripePayment.objects.get(stripe_subscription_id=subscription_id)
            except StripePayment.DoesNotExist:
                print(f"⚠️ Payment with subscription ID {subscription_id} not found.")
        elif payment_intent_id:
            try:
                payment = StripePayment.objects.get(stripe_payment_intent_id=payment_intent_id)
            except StripePayment.DoesNotExist:
                print(f"⚠️ Payment with PaymentIntent ID {payment_intent_id} not found.")
        
        if payment:
            if invoice_url:
                payment.invoice_url = invoice_url
            if payment_intent_id:
                payment.stripe_payment_intent_id = payment_intent_id
            payment.save()
            print(f"✅ Invoice created for payment ID {payment.id}.")
        else:
            print("⚠️ No payment found for the invoice.")

        return HttpResponse(status=200)
    
    def handle_charge_updated(self, data):
        payment_intent_id = data.get("payment_intent")
        receipt_url = data.get("receipt_url")
        charge_id = data.get("id")

        if not payment_intent_id:
            print("⚠️ No payment_intent in charge.updated")
            return HttpResponse(status=200)

        try:
            payment = StripePayment.objects.get(stripe_payment_intent_id=payment_intent_id)
            payment.stripe_charge_id = charge_id
            payment.receipt_url = receipt_url
            payment.save()
            print(f"✅ Receipt URL updated for PaymentIntent {payment_intent_id}")
        except StripePayment.DoesNotExist:
            print(f"⚠️ No payment found for PaymentIntent {payment_intent_id}")

        return HttpResponse(status=200)