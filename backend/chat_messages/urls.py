from django.urls import path
from .views import ChatMessageCreateView, ChatMessagesListView

urlpatterns = [
    path("create/", ChatMessageCreateView.as_view(), name="chat-message-create"),
    path("<int:chat_id>/messages/", ChatMessagesListView.as_view(), name="chat-messages-list"),
]
