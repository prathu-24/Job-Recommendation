from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.chatbot import ChatMessage
from app.api.deps import get_current_user
from app.services.chatbot_service import generate_chatbot_response
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/message", response_model=ChatMessageOut)
def send_message(
    chat_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not chat_in.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    # 1. Save user message to database
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=chat_in.message.strip()
    )
    db.add(user_msg)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while saving message: {e}"
        )

    # 2. Generate response using chatbot service
    try:
        ai_response_text = generate_chatbot_response(chat_in.message.strip(), current_user, db)
    except Exception as e:
        ai_response_text = f"I'm sorry, I encountered an internal error while processing that request: {e}"

    # 3. Save AI response to database
    ai_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=ai_response_text
    )
    db.add(ai_msg)
    
    try:
        db.commit()
        db.refresh(ai_msg)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while saving AI response: {e}"
        )
        
    return ai_msg

@router.get("/history", response_model=List[ChatMessageOut])
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch user's chat history ordered by creation time
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    return messages

@router.delete("/history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error while deleting chat history: {e}"
        )
        
    return {"message": "Chat history cleared successfully"}
