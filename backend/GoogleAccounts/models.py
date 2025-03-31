from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class GoogleAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="google_account")
    google_id = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.user.username} - {self.google_id}"
