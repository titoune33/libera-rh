"""Démarre le serveur de dev Vite en daemon (nouvelle session), détaché du process group du shell.

Usage: python3 .freebuff/start-dev.py
Le PID du daemon est écrit dans .freebuff/dev.pid.
"""
import os
import subprocess
import sys
import time

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(WORKSPACE, ".freebuff", "preview-5c11254c-825e-4baa-a18c-680a46b4707f.log")
PID_FILE = os.path.join(WORKSPACE, ".freebuff", "dev.pid")


def daemonize():
    # Premier fork : se détacher du process group du shell
    if os.fork() > 0:
        os._exit(0)
    os.setsid()  # nouvelle session => échappe au tueur de process group
    # Second fork : empêcher la ré-acquisition d'un terminal
    if os.fork() > 0:
        os._exit(0)
    os.umask(0o022)
    # Rediriger stdin/out/err
    devnull = os.open(os.devnull, os.O_RDWR)
    for fd in (0, 1, 2):
        os.dup2(devnull, fd)


def main():
    daemonize()
    with open(LOG, "w") as f:
        f.write("")
    with open(LOG, "a") as log:
        proc = subprocess.Popen(
            ["npm", "run", "dev", "--", "--port", "5173", "--strictPort"],
            cwd=WORKSPACE,
            stdout=log,
            stderr=log,
            stdin=subprocess.DEVNULL,
            start_new_session=True,
        )
        with open(PID_FILE, "w") as f:
            f.write(str(proc.pid))
        # Attendre la mort du process enfant (le daemon vit tant que vite vit)
        proc.wait()


if __name__ == "__main__":
    main()
