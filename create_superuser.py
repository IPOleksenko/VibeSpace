import subprocess
import os
import sys

def load_env(dotenv_paths=['env/backend.env']):
    """
    Loads environment variables from multiple .env files.
    """
    for dotenv_path in dotenv_paths:
        try:
            with open(dotenv_path, encoding='utf-8') as f:
                print(f"Loading: {dotenv_path}")
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())
        except FileNotFoundError:
            print(f"File not found: {dotenv_path}")

load_env()

username = "admin"
password = "admin"
email = "admin@gmail.com"

if len(sys.argv) > 1:
    try:
        username, password = sys.argv[1].split(":")
        email = f"{username}@gmail.com"
    except ValueError:
        print("❌ The argument must be in the format username:password")
        sys.exit(1)

code = f'''
from django.contrib.auth import get_user_model
User = get_user_model()

if not User.objects.filter(username="{username}").exists():
    user = User.objects.create_superuser("{username}", "{email}", "{password}")
    user.phone_number = "unique_{username}"
    user.save()
    print("✅ Superuser '{username}' has been created.")
else:
    print("ℹ️ Superuser '{username}' already exists.")
'''

subprocess.run([
    "pipenv", "run", "python", "backend/manage.py",
    "shell", "-c", code
])
