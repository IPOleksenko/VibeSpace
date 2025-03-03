import base64
from django.contrib.auth.models import AbstractUser
from django.db import models

class UserProfile(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.TextField(blank=True, null=True)  # Base64-encoded image

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="userprofile_set",
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="userprofile_set",
        blank=True
    )

    def set_avatar_from_file(self, image_file):
        """
        Takes an image file, converts it to a base64 string, and saves it to the avatar field.
        """
        self.avatar = base64.b64encode(image_file.read()).decode('utf-8')
        self.save()

    def __str__(self):
        return self.username
