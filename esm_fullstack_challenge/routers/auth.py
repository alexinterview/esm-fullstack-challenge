import sqlite3
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from esm_fullstack_challenge.config import ACCESS_TOKEN_EXPIRE_MINUTES
from esm_fullstack_challenge.auth.models import (
    Token, User, UserCreate, LoginRequest, UserResponse, LogoutResponse
)
from esm_fullstack_challenge.auth.utils import verify_password, get_password_hash, create_access_token
from esm_fullstack_challenge.auth.dependencies import get_user_by_username, get_current_active_user
from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db


auth_router = APIRouter()


@auth_router.post('/register', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: DB = Depends(get_db)) -> UserResponse:
    """Register a new user account."""
    existing_user = get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE email = ?', (user.email,))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        cur.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM users')
        new_id = cur.fetchone()[0]
        hashed_password = get_password_hash(user.password)
        cur.execute(
            'INSERT INTO users (id, username, email, hashed_password, full_name, disabled) VALUES (?, ?, ?, ?, ?, ?)',
            (new_id, user.username, user.email, hashed_password, user.full_name, False)
        )
        conn.commit()
        cur.execute('SELECT id, username, email, full_name, disabled, created_at FROM users WHERE id = ?', (new_id,))
        row = cur.fetchone()

    return UserResponse(
        id=row[0],
        username=row[1],
        email=row[2],
        full_name=row[3],
        disabled=bool(row[4]),
        created_at=row[5]
    )


@auth_router.post('/login', response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: DB = Depends(get_db)
) -> Token:
    """OAuth2 form login - returns JWT token."""
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@auth_router.post('/login/json', response_model=Token)
def login_json(
    login_request: LoginRequest,
    db: DB = Depends(get_db)
) -> Token:
    """JSON login - returns JWT token. For frontend use."""
    user = get_user_by_username(db, login_request.username)
    if not user or not verify_password(login_request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@auth_router.get('/me', response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user info."""
    return current_user


@auth_router.post('/logout', response_model=LogoutResponse)
def logout() -> LogoutResponse:
    """Logout (stateless - just returns success)."""
    return LogoutResponse(message="Successfully logged out")
