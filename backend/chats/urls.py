from django.urls import path
from .views import ChatCreateView, ChatListView

urlpatterns = [
    path("create/", ChatCreateView.as_view(), name="chats_create"),
    path("get/", ChatListView.as_view(), name="chats_get"),
]
