import os
import subprocess
import signal
import sys
import time
import re

processes = []

def signal_handler(sig, frame):
    print('Stopping servers...')
    for p in processes:
        # Send SIGTERM to the process group to ensure all child processes are terminated
        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def setup_database():
    """Ensure the database is clean and created."""
    db_file = os.path.join('instance', 'dev.db')
    if os.path.exists(db_file):
        print("Removing old database file...")
        os.remove(db_file)
    
    print("Creating new database...")
    try:
        subprocess.run(['python3', 'create_db.py'], check=True)
        print("Database created successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error creating database: {e}")
        sys.exit(1)

def kill_process_on_port(port):
    try:
        # Find the process ID (PID) using the specified port
        result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        pids = result.stdout.strip().split('\n')
        for pid in pids:
            if pid:
                print(f"Killing process {pid} on port {port}")
                os.kill(int(pid), signal.SIGKILL)
    except Exception as e:
        print(f"Error killing process on port {port}: {e}")

# Kill existing services before setting up the database
for port in [5005, 5007, 5000, 5175]:
    kill_process_on_port(port)

# Setup the database
setup_database()

services = [
    {
        "name": "signal_generator",
        "command": "npm start",
        "cwd": "signal_generator",
        "port": 5005
    },
    {
        "name": "forex_data_service",
        "command": "python3 server.py",
        "cwd": "forex_data_service",
        "port": 5007
    },
    {
        "name": "journal_service",
        "command": "PYTHONPATH=. python3 journal/run_journal.py",
        "cwd": ".",
        "port": 5000
    },
    {
        "name": "frontend",
        "command": "npm run dev",
        "cwd": ".",
        "port": 5175
    }
]

for service in services:
    try:
        print(f"Starting {service['name']} service...")
        pro = subprocess.Popen(
            service["command"],
            shell=True,
            preexec_fn=os.setsid,
            cwd=service["cwd"],
            stderr=subprocess.STDOUT
        )
        processes.append(pro)
    except Exception as e:
        print(f"Error starting {service['name']} service: {e}")

print("All services started.")

# Keep the main script alive to manage child processes
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    signal_handler(None, None)
