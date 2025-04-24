import os
import subprocess

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

def run_migrations():
    try:
        # Activate virtual environment and run migrations
        subprocess.run(["pipenv", "run", "python", "backend/manage.py", "makemigrations"], check=True)
        subprocess.run(["pipenv", "run", "python", "backend/manage.py", "migrate"], check=True)
        print("✅ Migrations executed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing migrations: {e}")

if __name__ == "__main__":
    load_env()
    run_migrations()
