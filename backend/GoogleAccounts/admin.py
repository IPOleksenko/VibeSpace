from django.contrib import admin
from .models import GoogleAccount

@admin.register(GoogleAccount)
class GoogleAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "google_id")
