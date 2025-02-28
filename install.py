import subprocess
import sys
import os

PIPFILE = "Pipfile"
PIPFILE_LOCK = "Pipfile.lock"
FRONTEND_DIR = "frontend"


def run_command(command, cwd=None, capture_output=False):
    """Executes a command and returns the result (if needed)"""
    try:
        if capture_output:
            result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=True)
            return result.stdout.strip()
        else:
            subprocess.check_call(command, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing command: {' '.join(command)}\n{e}")
        sys.exit(1)


def ensure_pipenv():
    """Ensures pipenv is installed"""
    try:
        subprocess.run(["pipenv", "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("🟡 Pipenv not found. Installing...")
        run_command([sys.executable, "-m", "pip", "install", "pipenv"])
        print("✅ Pipenv installed!\n")


def ensure_pipfile():
    """Ensures Pipfile exists, otherwise initializes it"""
    if not os.path.exists(PIPFILE):
        print(f"🟡 {PIPFILE} not found. Creating...")
        run_command(["pipenv", "install"])
        print(f"✅ {PIPFILE} created!\n")


def install_pipenv_dependencies():
    """Installs backend dependencies using Pipenv"""
    if not os.path.exists(PIPFILE_LOCK):
        print(f"🟡 {PIPFILE_LOCK} not found. Generating it...")
        run_command(["pipenv", "lock"])

    print(f"🟢 Installing backend dependencies from {PIPFILE_LOCK}...")
    run_command(["pipenv", "sync"])
    print("✅ Backend dependencies installed!\n")


def setup_nodeenv():
    """Installs nodeenv and initializes Node.js inside Pipenv"""
    print("🟢 Checking and installing nodeenv...")
    run_command(["pipenv", "install", "nodeenv"])
    run_command(["pipenv", "run", "nodeenv", "-p"])
    print("✅ Node.js successfully installed in Pipenv!\n")


def install_frontend_dependencies():
    """Installs frontend dependencies inside Pipenv"""
    package_json = os.path.join(FRONTEND_DIR, "package.json")
    if not os.path.exists(package_json):
        print(f"❌ File {package_json} not found in {FRONTEND_DIR}!")
        sys.exit(1)

    print("🟢 Clearing npm cache...")
    run_command(["pipenv", "run", "npm", "cache", "clean", "--force"])

    print(f"🟢 Installing frontend dependencies in {FRONTEND_DIR}...")
    run_command(["pipenv", "run", "npm", "install"], cwd=FRONTEND_DIR)
    print("✅ Frontend dependencies installed!\n")


def show_installed_dependencies():
    """Displays a list of installed dependencies"""
    print("\n📦 Installed Python dependencies (pipenv):")
    pipenv_deps = run_command(["pipenv", "run", "pip", "list"], capture_output=True)
    if pipenv_deps:
        print("\n".join(pipenv_deps.split("\n")[2:]))
    else:
        print("❌ Failed to retrieve the list of dependencies.")

    print("\n📦 Installed npm dependencies (frontend):")
    npm_deps = run_command(["pipenv", "run", "npm", "list", "--depth=0"], cwd=FRONTEND_DIR, capture_output=True)
    if npm_deps:
        deps_lines = npm_deps.split("\n")[1:]
        print("\n".join(deps_lines) if deps_lines else "❌ No installed npm dependencies.")
    else:
        print("❌ Failed to retrieve the list of npm dependencies.")


if __name__ == "__main__":
    ensure_pipenv()
    ensure_pipfile()
    install_pipenv_dependencies()
    setup_nodeenv()
    install_frontend_dependencies()
    show_installed_dependencies()
