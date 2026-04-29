#!/usr/bin/env python3
"""
Build-time migration script for Render deployments.

Handles the case where alembic_version contains a phantom revision (one that
no longer exists in the codebase). Instead of failing, it stamps the DB with
the current HEAD so that `alembic upgrade head` becomes a safe no-op.

Render Build Command:
    pip install -r requirements.txt && python render_migrate.py
"""
import subprocess
import sys

HEAD_REVISION = "d8e4c1a9b7f3"
PHANTOM_INDICATORS = [
    "Can't locate revision",
    "ResolutionError",
    "No such revision",
    "relative revision",
]


def run(cmd: str, check: bool = True) -> subprocess.CompletedProcess:
    print(f"$ {cmd}", flush=True)
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout, flush=True)
    if result.stderr:
        print(result.stderr, file=sys.stderr, flush=True)
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result


def main() -> None:
    # Probe current DB revision without failing the build on error.
    probe = run("alembic current", check=False)
    combined = probe.stdout + probe.stderr

    phantom_detected = probe.returncode != 0 or any(
        indicator in combined for indicator in PHANTOM_INDICATORS
    )

    if phantom_detected:
        print(
            f"\n[render_migrate] Phantom or missing revision detected in alembic_version.\n"
            f"[render_migrate] Stamping DB as HEAD ({HEAD_REVISION}) — no schema changes.\n",
            flush=True,
        )
        run(f"alembic stamp {HEAD_REVISION}")

    # Always attempt upgrade; if already at HEAD this is a safe no-op.
    run("alembic upgrade head")
    print("\n[render_migrate] Migrations complete.", flush=True)


if __name__ == "__main__":
    main()
