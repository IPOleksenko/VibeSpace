from django.contrib import admin
from django.utils.html import format_html
from django.conf import settings
from .models import UserMedia

class UserMediaAdmin(admin.ModelAdmin):
    list_display = ("title", "preview", "uploaded_at")

    def preview(self, obj):
        if not obj.file:
            return "-"

        file_url = f"{settings.MEDIA_URL}{obj.file}"
        file_name = str(obj.file.name).lower()

        if file_name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            return format_html(f'<img src="{file_url}" width="100">')
        elif file_name.endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
            return format_html(f'<video width="100" controls><source src="{file_url}" type="video/mp4"></video>')
        return "-"

    preview.allow_tags = True
    preview.short_description = "Preview"

admin.site.register(UserMedia, UserMediaAdmin)
