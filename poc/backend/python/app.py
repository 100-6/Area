from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from typing import Annotated

from db import Base, engine, get_session
from models import User
from auth import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI(title="Basic Auth API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

SessionDep = Annotated[Session, Depends(get_session)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, session: SessionDep):
    stmt = select(User).where(or_(User.username == data.username, User.email == data.email))
    existing = session.execute(stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    user = User(username=data.username, email=data.email, password_hash=hash_password(data.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.post("/login", response_model=TokenResponse)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    stmt = select(User).where(User.username == form_data.username)
    user = session.execute(stmt).scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)

def get_current_user(token: TokenDep, session: SessionDep) -> User:
    subject = decode_access_token(token)
    if subject is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.get(User, int(subject))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

UserDep = Annotated[User, Depends(get_current_user)]

@app.get("/me", response_model=UserOut)
def me(current_user: UserDep):
    return current_user

import uvicorn

def main():
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()