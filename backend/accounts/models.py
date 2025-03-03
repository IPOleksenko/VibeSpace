import base64
from django.db import models

class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.TextField(blank=True, null=True)  # Base64-encoded image

    def __str__(self):
        return self.username

    def set_avatar_from_file(self, image_file):
        """
        Takes an image file, converts it to a base64 string, and saves it to the avatar field.
        """
        self.avatar = base64.b64encode(image_file.read()).decode('utf-8')
