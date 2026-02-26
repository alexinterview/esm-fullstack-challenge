import sqlite3
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from esm_fullstack_challenge.config import SECRET_KEY, ALGORITHM
from esm_fullstack_challenge.auth.models import TokenData, User, UserInDB
from esm_fullstack_challenge.db import DB
from esm_fullstack_challenge.dependencies import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_user_by_username(db: DB, username: str) -> Optional[UserInDB]:
    with db.get_connection() as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE username = ?', (username,))
        user_row = cur.fetchone()
        if user_row:
            return UserInDB(**dict(user_row))
    return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DB = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return User(**user.model_dump())


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
