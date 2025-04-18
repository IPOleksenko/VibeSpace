from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class StripePayment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment", db_index=True)

    stripe_payment_intent_id = models.CharField(
        max_length=100, unique=True, blank=True, null=True,
        help_text="Unique Stripe payment_intent identifier"
    )

    stripe_checkout_session_id = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Stripe Checkout session identifier"
    )

    stripe_charge_id = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Stripe charge identifier"
    )

    stripe_subscription_id = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Stripe subscription identifier (if applicable)"
    )

    payment_type = models.CharField(
        max_length=20, default='one_time',
        help_text="Payment type: one-time payment or subscription"
    )

    amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Payment amount"
    )

    currency = models.CharField(
        max_length=10, default='usd',
        help_text="Payment currency (e.g., usd)"
    )

    status = models.CharField(
        max_length=50,
        help_text="Payment status (e.g., succeeded, requires_payment_method)"
    )

    customer_email = models.EmailField(
        blank=True, null=True,
        help_text="Customer email"
    )
    customer_name = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Customer name"
    )

    payment_method = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Payment method identifier provided by Stripe"
    )

    metadata = models.JSONField(
        blank=True, null=True,
        help_text="Additional payment data in JSON format"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_payment_type_display()} {self.amount} {self.currency.upper()} - {self.status}"
