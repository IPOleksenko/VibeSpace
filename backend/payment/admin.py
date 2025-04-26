from django.contrib import admin
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django import forms
import datetime
import stripe

from .models import Product

class ProductForm(forms.ModelForm):
    subscription_days = forms.IntegerField(
        label="Subscription period (days)",
        required=False,
        min_value=1,
        help_text="Duration of subscription in days."
    )

    class Meta:
        model = Product
        exclude = ('subscription_period',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Make fields read-only when editing
        if self.instance and self.instance.pk:
            self.fields['subscription_days'].disabled = True
            self.fields['type'].disabled = True

        if self.instance and self.instance.subscription_period:
            self.fields['subscription_days'].initial = self.instance.subscription_period.days

    def clean(self):
        cleaned = super().clean()

        if self.instance and self.instance.pk:
            # When editing — use previously saved values
            cleaned['subscription_period'] = self.instance.subscription_period
            cleaned['type'] = self.instance.type
            return cleaned

        prod_type = cleaned.get('type')
        days = cleaned.get('subscription_days')

        if prod_type == 'subscription':
            if not days:
                raise forms.ValidationError("Subscription products must have a subscription period in days.")
            cleaned['subscription_period'] = datetime.timedelta(days=days)
        else:
            if days:
                raise forms.ValidationError("One-time products should not have a subscription period.")
            cleaned['subscription_period'] = None

        return cleaned

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductForm
    list_display = ('name', 'type', 'price', 'is_active', 'created_at')
    readonly_fields = (
        'stripe_product_id', 'stripe_price_id', 'created_at', 'updated_at'
    )

    def save_model(self, request, obj, form, change):
        # Ensure subscription_period is set from form.cleaned_data
        sub_period = form.cleaned_data.get('subscription_period')
        obj.subscription_period = sub_period

        if not change:
            # === CREATE PRODUCT in Stripe ===
            stripe_product = stripe.Product.create(
                name=obj.name,
                description=obj.description,
                active=obj.is_active,
            )
            obj.stripe_product_id = stripe_product.id

            stripe_price = self._create_stripe_price(obj)
            obj.stripe_price_id = stripe_price.id
        else:
            # === UPDATE PRODUCT ===
            old = Product.objects.get(pk=obj.pk)

            # Activity changed
            if obj.is_active != old.is_active:
                if obj.is_active:
                    if obj.stripe_product_id:
                        stripe.Product.modify(obj.stripe_product_id, active=True)
                    if obj.stripe_price_id:
                        stripe.Price.modify(obj.stripe_price_id, active=True)
                else:
                    self._archive_product(obj)

            # Name/description changed
            if (obj.name != old.name or obj.description != old.description) and obj.stripe_product_id:
                stripe.Product.modify(
                    obj.stripe_product_id,
                    name=obj.name,
                    description=obj.description,
                    active=obj.is_active
                )

            # Price/type/period changed
            if (
                obj.price != old.price or
                obj.type != old.type or
                obj.subscription_period != old.subscription_period
            ):
                if obj.stripe_price_id:
                    stripe.Price.modify(obj.stripe_price_id, active=False)

                new_price = self._create_stripe_price(obj)
                obj.stripe_price_id = new_price.id

        super().save_model(request, obj, form, change)

    def delete_model(self, request, obj):
        self._archive_product(obj)
        super().delete_model(request, obj)

    def _create_stripe_price(self, obj):
        unit_amount = int(obj.price * 100)
        if obj.type == 'one_time':
            return stripe.Price.create(
                product=obj.stripe_product_id,
                unit_amount=unit_amount,
                currency='usd',
            )
        else:
            # Subscription: interval 'day', count = days
            return stripe.Price.create(
                product=obj.stripe_product_id,
                unit_amount=unit_amount,
                currency='usd',
                recurring={
                    'interval': 'day',
                    'interval_count': obj.subscription_period.days
                }
            )

    def _archive_product(self, obj):
        if obj.stripe_product_id:
            stripe.Product.modify(obj.stripe_product_id, active=False)
        if obj.stripe_price_id:
            stripe.Price.modify(obj.stripe_price_id, active=False)


# Signal for archiving on delete
@receiver(pre_delete, sender=Product)
def archive_product_on_delete(sender, instance, **kwargs):
    if instance.stripe_product_id:
        try:
            stripe.Product.modify(instance.stripe_product_id, active=False)
        except stripe.error.InvalidRequestError:
            pass

    if instance.stripe_price_id:
        try:
            stripe.Price.modify(instance.stripe_price_id, active=False)
        except stripe.error.InvalidRequestError:
            pass
