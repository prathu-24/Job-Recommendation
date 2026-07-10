from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core import security
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.candidate import CandidateProfile
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token, RefreshTokenRequest
from app.api.deps import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter()

# Schema for JSON logins
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
        
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        password=hashed_password,
        role=user_in.role
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        
        # Auto-create empty profile for candidate
        if db_user.role == UserRole.CANDIDATE:
            profile = CandidateProfile(
                user_id=db_user.id,
                skills="",
                experience="",
                education=""
            )
            db.add(profile)
            db.commit()
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error during registration: {e}"
        )
        
    return db_user

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not security.verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "role": user.role
    }

# Also support standard OAuth2 Form request for swagger UI support
@router.post("/oauth2-login", response_model=Token, include_in_schema=False)
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "role": user.role
    }

@router.post("/refresh", response_model=Token)
def refresh_token(token_req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = security.decode_token(token_req.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    user_id = payload.get("sub")
    token_type = payload.get("type")
    
    if user_id is None or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token structure"
        )
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": security.create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
        "role": user.role
    }

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
