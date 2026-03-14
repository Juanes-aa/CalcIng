import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

class TestDatabaseConnection:
    @pytest.mark.anyio
    async def test_engine_creates_successfully(self, db_session):
        """La sesión async se crea sin errores"""
        assert db_session is not None

    @pytest.mark.anyio
    async def test_session_is_async(self, db_session):
        """La sesión es una instancia de AsyncSession"""
        assert isinstance(db_session, AsyncSession)

class TestUserModel:
    @pytest.mark.anyio
    async def test_create_user(self, db_session):
        """Se puede crear un usuario con email y password_hash"""
        from db.models import User
        user = User(email="test@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        assert user.id is not None
        assert user.email == "test@example.com"

    @pytest.mark.anyio
    async def test_user_id_is_uuid(self, db_session):
        """El id del usuario es un UUID"""
        import uuid
        from db.models import User
        user = User(email="uuid@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        assert isinstance(user.id, uuid.UUID)

    @pytest.mark.anyio
    async def test_user_created_at_is_set(self, db_session):
        """created_at se asigna automáticamente al crear"""
        from db.models import User
        from datetime import datetime
        user = User(email="time@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        assert isinstance(user.created_at, datetime)

    @pytest.mark.anyio
    async def test_user_email_unique(self, db_session):
        """No se pueden crear dos usuarios con el mismo email"""
        from db.models import User
        from sqlalchemy.exc import IntegrityError
        user1 = User(email="dup@example.com", password_hash="h1")
        user2 = User(email="dup@example.com", password_hash="h2")
        db_session.add(user1)
        await db_session.commit()
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            await db_session.commit()

class TestProblemModel:
    @pytest.mark.anyio
    async def test_create_problem(self, db_session):
        """Se puede crear un problema asociado a un usuario"""
        from db.models import User, Problem
        user = User(email="prob@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        problem = Problem(
            user_id=user.id,
            expression="x^2",
            result="2x",
            type="differentiate"
        )
        db_session.add(problem)
        await db_session.commit()
        await db_session.refresh(problem)
        assert problem.id is not None
        assert problem.user_id == user.id

    @pytest.mark.anyio
    async def test_problem_id_is_uuid(self, db_session):
        """El id del problema es un UUID"""
        import uuid
        from db.models import User, Problem
        user = User(email="probid@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        problem = Problem(
            user_id=user.id,
            expression="sin(x)",
            result="-cos(x)",
            type="integrate"
        )
        db_session.add(problem)
        await db_session.commit()
        await db_session.refresh(problem)
        assert isinstance(problem.id, uuid.UUID)

    @pytest.mark.anyio
    async def test_problem_created_at_is_set(self, db_session):
        """created_at se asigna automáticamente"""
        from db.models import User, Problem
        from datetime import datetime
        user = User(email="probtime@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        problem = Problem(
            user_id=user.id,
            expression="2+2",
            result="4",
            type="solve"
        )
        db_session.add(problem)
        await db_session.commit()
        await db_session.refresh(problem)
        assert isinstance(problem.created_at, datetime)

    @pytest.mark.anyio
    async def test_problem_cascade_delete(self, db_session):
        """Al borrar un usuario se borran sus problemas"""
        from db.models import User, Problem
        from sqlalchemy import select
        user = User(email="cascade@example.com", password_hash="hashed")
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        problem = Problem(
            user_id=user.id,
            expression="x",
            result="1",
            type="differentiate"
        )
        db_session.add(problem)
        await db_session.commit()

        await db_session.delete(user)
        await db_session.commit()

        result = await db_session.execute(
            select(Problem).where(Problem.user_id == user.id)
        )
        assert result.scalars().first() is None