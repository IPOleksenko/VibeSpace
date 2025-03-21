from django.db import models
from django.contrib.auth import get_user_model
from AWS.S3.models import UserMedia

User = get_user_model()

class Post(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts", db_index=True)
    text = models.TextField(blank=True)
    media = models.ManyToManyField(UserMedia, blank=True, related_name="posts")
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        short_text = (self.text[:30] + "...") if self.text else "No text"
        return f"Post by {self.user.username} at {self.uploaded_at.strftime('%Y-%m-%d %H:%M')} | {short_text}"

    @property
    def first_media(self):
        return self.media.first()