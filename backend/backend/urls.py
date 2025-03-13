from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/accounts/', include('accounts.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/AWS/', include('AWS.S3.urls')),
    path('api/chats/', include('chats.urls')),
    path('api/chat_messages/', include('chat_messages.urls')),
]
