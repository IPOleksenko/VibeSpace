import subprocess

def run_migrations():
    try:
        # Activate virtual environment and run migrations
        subprocess.run(["pipenv", "run", "python", "backend/manage.py", "makemigrations"], check=True)
        subprocess.run(["pipenv", "run", "python", "backend/manage.py", "migrate"], check=True)
        print("✅ Migrations executed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing migrations: {e}")

if __name__ == "__main__":
    run_migrations()
