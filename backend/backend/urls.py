from django.contrib import admin
from django.urls import path
from accounts.views import create_user

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/users/', create_user, name='create_user'),
]
