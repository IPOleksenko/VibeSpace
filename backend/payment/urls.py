from django.urls import path
from .views import CheckoutSessionView, SubscriptionStatusView, CancelSubscriptionView, ProductListView
from .webhook import StripeWebhookView

urlpatterns = [
    path("stripe/checkout_session/", CheckoutSessionView.as_view(), name="stripe_checkout_session"),
    path('status/<int:user_id>/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('stripe/cancel/', CancelSubscriptionView.as_view(), name='subscription-cancel'),
    path('products/', ProductListView.as_view(), name='product-list'),

    path("stripe/webhook/", StripeWebhookView.as_view(), name="stripe_webhook"),
]
