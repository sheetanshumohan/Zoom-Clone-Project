import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    sender = Column(String(100), nullable=False)
    text = Column(String(2000), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="chat_messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender='{self.sender}', text='{self.text[:20]}')>"
