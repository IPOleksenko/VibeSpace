from django.db import models
from django.contrib.auth import get_user_model
from chats.models import Chat
from AWS.S3.models import UserMedia

User = get_user_model()

class ChatMessage(models.Model):
    id = models.AutoField(primary_key=True)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages", db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages", db_index=True)
    text = models.TextField(blank=True, null=True)
    media = models.ForeignKey(UserMedia, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages")
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"Message from {self.user.username} in chat {self.chat.id}"
