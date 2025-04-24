#!/usr/bin/env python3
import os
import subprocess
import sys

def load_env(dotenv_paths=['env/frontend.env', 'env/backend.env']):
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

def run_command(command, cwd):
    """Runs a command in a new terminal window and keeps it open on error."""
    is_windows = sys.platform.startswith("win")
    if is_windows:
        return subprocess.Popen(
            ["cmd", "/k", command],
            cwd=cwd,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        terminal = None
        for term in ["gnome-terminal", "konsole", "xfce4-terminal", "lxterminal", "x-terminal-emulator"]:
            if subprocess.call(f"command -v {term}", shell=True,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
                terminal = term
                break
        if not terminal:
            raise RuntimeError("No supported terminal emulator found!")

        return subprocess.Popen(
            f"{terminal} -- bash -c '{command}; echo \"Press Enter to exit...\"; read'", 
            cwd=cwd, 
            shell=True
        )

def check_redis_in_wsl():
    """Ping Redis inside WSL, start it if needed, and keep terminal open."""
    if sys.platform.startswith("win"):
        try:
            result = subprocess.run(["wsl", "--status"], capture_output=True, text=True)
            if result.returncode == 0:
                print("WSL is available. Starting Redis if not running...")

                subprocess.Popen(
                    [
                        "cmd", "/c",
                        "start", "wsl", "bash", "-c",
                        (
                            "pgrep redis-server >/dev/null || (echo 'Starting redis-server...'; redis-server --daemonize yes); "
                            "echo 'Pinging Redis...'; redis-cli ping; "
                            "echo; echo 'Redis should now be running in background.'; echo 'Press any key to keep WSL open...'; read -n 1"
                        )
                    ]
                )
            else:
                print("WSL is not properly configured.")
        except FileNotFoundError:
            print("WSL not found on this system.")


# Directory paths
backend_path = os.path.abspath("backend")
frontend_path = os.path.abspath("frontend")

# Commands
django_cmd = "pipenv run python manage.py runserver"
daphne_cmd = "pipenv run daphne -b 0.0.0.0 -p 8001 backend.asgi:application"
npm_cmd    = "pipenv run npm start"
stripe_cli = "stripe listen --forward-to localhost:8000/api/payment/stripe/webhook/"

def start_processes():
    check_redis_in_wsl()

    django_process      = run_command(django_cmd, backend_path)
    daphne_process      = run_command(daphne_cmd, backend_path)
    stripe_cli_process  = run_command(stripe_cli, backend_path)
    npm_process         = run_command(npm_cmd, frontend_path)

    try:
        django_process.wait()
        daphne_process.wait()
        stripe_cli_process.wait()
        npm_process.wait()
    except KeyboardInterrupt:
        print("Stopping servers...")
        for p in (django_process, daphne_process, stripe_cli_process, npm_process):
            p.terminate()
        # Wait for processes to exit, force kill if needed
        for p in (django_process, daphne_process, stripe_cli_process, npm_process):
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()

if __name__ == "__main__":
    start_processes()
