import subprocess
from pathlib import Path

# Raíz de services/math-engine/ (sube de tests/ → math-engine/)
BASE_PATH = Path(__file__).parent.parent


def test_alembic_ini_exists():
    """TEST 1 — alembic.ini existe en la raíz de services/math-engine/"""
    alembic_ini = BASE_PATH / "alembic.ini"
    assert alembic_ini.exists(), (
        f"No se encontró alembic.ini en {BASE_PATH}. "
        "Ejecuta 'alembic init alembic' desde services/math-engine/"
    )


def test_alembic_directory_exists():
    """TEST 2 — carpeta alembic/ existe en la raíz de services/math-engine/"""
    alembic_dir = BASE_PATH / "alembic"
    assert alembic_dir.is_dir(), (
        f"No se encontró el directorio alembic/ en {BASE_PATH}. "
        "Ejecuta 'alembic init alembic' desde services/math-engine/"
    )


def test_alembic_env_py_exists():
    """TEST 3 — alembic/env.py existe"""
    env_py = BASE_PATH / "alembic" / "env.py"
    assert env_py.exists(), (
        f"No se encontró alembic/env.py en {BASE_PATH}. "
        "Verifica que la inicialización de alembic fue correcta."
    )


def test_alembic_initial_migration_exists():
    """TEST 4 — alembic/versions/ existe y contiene al menos un archivo .py"""
    versions_dir = BASE_PATH / "alembic" / "versions"
    assert versions_dir.is_dir(), (
        f"No se encontró el directorio alembic/versions/ en {BASE_PATH}. "
        "Ejecuta 'alembic revision --autogenerate -m \"initial\"' para crear la migración inicial."
    )
    migration_files = list(versions_dir.glob("*.py"))
    assert len(migration_files) >= 1, (
        f"El directorio alembic/versions/ existe pero no contiene ningún archivo .py. "
        "Ejecuta 'alembic revision --autogenerate -m \"initial\"' para crear la migración inicial."
    )


def test_alembic_upgrade_and_downgrade():
    """TEST 5 — la migración sube y baja sin errores contra SQLite en memoria"""
    test_db = BASE_PATH / "test_migration.db"

    try:
        upgrade = subprocess.run(
            [
                "alembic",
                "-x", "db_url=sqlite:///./test_migration.db",
                "upgrade", "head",
            ],
            cwd=BASE_PATH,
            capture_output=True,
            text=True,
        )
        assert upgrade.returncode == 0, (
            f"'alembic upgrade head' falló con código {upgrade.returncode}.\n"
            f"stdout: {upgrade.stdout}\n"
            f"stderr: {upgrade.stderr}"
        )

        downgrade = subprocess.run(
            [
                "alembic",
                "-x", "db_url=sqlite:///./test_migration.db",
                "downgrade", "base",
            ],
            cwd=BASE_PATH,
            capture_output=True,
            text=True,
        )
        assert downgrade.returncode == 0, (
            f"'alembic downgrade base' falló con código {downgrade.returncode}.\n"
            f"stdout: {downgrade.stdout}\n"
            f"stderr: {downgrade.stderr}"
        )

    finally:
        if test_db.exists():
            test_db.unlink()