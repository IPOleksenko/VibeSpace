from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Chat(models.Model):
    users = models.ManyToManyField(User, related_name="chats")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """ Sort users before saving to avoid duplicates """
        super().save(*args, **kwargs)
        sorted_users = sorted(self.users.all(), key=lambda user: user.id)
        self.users.set(sorted_users)

    @classmethod
    def get_or_create(cls, users):
        """ Gets an existing chat or creates a new one """
        sorted_users = sorted(users, key=lambda user: user.id)
        chats = cls.objects.annotate(user_count=models.Count("users")).filter(user_count=len(users))
        for chat in chats:
            if set(chat.users.all()) == set(sorted_users):
                return chat, False
        chat = cls.objects.create()
        chat.users.set(sorted_users)
        return chat, True

    def __str__(self):
        user_list = self.users.values_list("username", flat=True)
        return f"Chat between: {', '.join(user_list)}"
