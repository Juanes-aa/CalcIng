from pathlib import Path

MONOREPO_ROOT = Path(__file__).parent.parent.parent.parent


def test_github_workflows_dir_exists():
    workflows_dir = MONOREPO_ROOT / ".github" / "workflows"
    assert workflows_dir.is_dir(), (
        f"El directorio .github/workflows/ no existe en: {MONOREPO_ROOT}"
    )


def test_ci_yml_exists():
    ci_file = MONOREPO_ROOT / ".github" / "workflows" / "ci.yml"
    assert ci_file.exists(), (
        f"El archivo .github/workflows/ci.yml no existe en: {MONOREPO_ROOT}"
    )


def test_ci_yml_contains_frontend_job():
    ci_file = MONOREPO_ROOT / ".github" / "workflows" / "ci.yml"
    content = ci_file.read_text()
    assert "vitest" in content, (
        "ci.yml no contiene 'vitest': el job de frontend no está configurado"
    )


def test_ci_yml_contains_backend_job():
    ci_file = MONOREPO_ROOT / ".github" / "workflows" / "ci.yml"
    content = ci_file.read_text()
    assert "pytest" in content, (
        "ci.yml no contiene 'pytest': el job de backend no está configurado"
    )