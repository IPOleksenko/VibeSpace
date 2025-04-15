import subprocess

code = """
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@gmail.com', 'admin')
    print("✅ Superuser 'admin' has been created.")
else:
    print("ℹ️ Superuser 'admin' already exists.")
"""

subprocess.run([
    "pipenv", "run", "python", "backend/manage.py",
    "shell", "-c", code
])
