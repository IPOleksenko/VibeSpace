from django.urls import path
from .views import CheckoutSessionView, SubscriptionStatusView
from .webhook import StripeWebhookView

urlpatterns = [
    path("stripe/checkout_session/", CheckoutSessionView.as_view(), name="stripe_checkout_session"),
    path('status/<int:user_id>/', SubscriptionStatusView.as_view(), name='subscription-status'),

    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe_webhook"),
]
