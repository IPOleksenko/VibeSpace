from django.urls import path
from .views import CheckoutSessionView, StripeWebhookView, SubscriptionStatusView

urlpatterns = [
    path("stripe/checkout_session/", CheckoutSessionView.as_view(), name="stripe_checkout_session"),
    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe_webhook"),
    path('status/<int:user_id>/', SubscriptionStatusView.as_view(), name='subscription-status'),
]
