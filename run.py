import os
import subprocess
import sys
import signal

def run_command(command, cwd):
    """Runs a command in a new terminal window and keeps it open on error."""
    is_windows = sys.platform.startswith("win")
    
    if is_windows:
        return subprocess.Popen(
            ["cmd", "/k", command],  # /k keeps the window open
            cwd=cwd,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        # Check for available terminal emulator
        terminal = None
        for term in ["gnome-terminal", "konsole", "xfce4-terminal", "lxterminal", "x-terminal-emulator"]:
            if subprocess.call(f"command -v {term}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0:
                terminal = term
                break
        
        if not terminal:
            raise RuntimeError("No supported terminal emulator found!")

        return subprocess.Popen(
            f"{terminal} -- bash -c '{command}; echo \"Press Enter to exit...\"; read'", 
            cwd=cwd, 
            shell=True
        )

# Directory paths
backend_path = os.path.abspath("backend")
frontend_path = os.path.abspath("frontend")

# Commands
django_cmd = "pipenv run python manage.py runserver"
npm_cmd = "pipenv run npm start"

# Start processes in separate windows
django_process = run_command(django_cmd, backend_path)
npm_process = run_command(npm_cmd, frontend_path)

try:
    django_process.wait()
    npm_process.wait()
except KeyboardInterrupt:
    print("Stopping servers...")
    django_process.terminate()
    npm_process.terminate()
    try:
        django_process.wait(timeout=5)
        npm_process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        django_process.kill()
        npm_process.kill()
