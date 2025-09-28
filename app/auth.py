from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.db import users_db

class AuthHandler:
    # 1. Password hashing setup
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # 2. Token authentication setup
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

    # ---- Password Hashing ----
    def hash_password(self, password: str):
        return self.pwd_context.hash(password)

    def verify_password(self, plain: str, hashed: str):
        return self.pwd_context.verify(plain, hashed)

    # ---- JWT Token ----
    def create_access_token(self, username: str, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
        expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
        payload = {"sub": username, "exp": expire}
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def decode_token(self, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            if username is None or username not in users_db:
                raise HTTPException(status_code=401, detail="Invalid token")
            return users_db[username]
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    # ---- Dependency Wrapper ----
    def auth_wrapper(self, token: str = Depends(oauth2_scheme)):
        return self.decode_token(token)

# Password Hashing (Passlib)
# CryptContext lets us define how passwords are stored.
# We use bcrypt → an industry-standard algorithm for hashing passwords.
# hash_password → converts plain password to hash.
# verify_password → checks if a plain password matches stored hash.
# JWT (JSON Web Token)
# jwt.encode → creates token with payload (username + expiry).
# jwt.decode → verifies token using SECRET_KEY and ALGORITHM.
# If token is expired or tampered, it raises an error.
# OAuth2PasswordBearer
# Tells FastAPI how to extract token from Authorization: Bearer <token> header.
# auth_wrapper is a dependency — we can attach it to any route to make it secure.