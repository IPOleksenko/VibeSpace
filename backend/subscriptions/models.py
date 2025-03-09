from django.db import models
from django.core.exceptions import ValidationError

class UserSubscription(models.Model):
    subscriber = models.ForeignKey(
        'accounts.UserProfile',
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    subscribed_to = models.ForeignKey(
        'accounts.UserProfile',
        on_delete=models.CASCADE,
        related_name='subscribers'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('subscriber', 'subscribed_to')
    
    def __str__(self):
        return f"{self.subscriber} is subscribed to {self.subscribed_to}"
    
    def clean(self):
        if self.subscriber == self.subscribed_to:
            raise ValidationError("A user cannot subscribe to themselves.")
