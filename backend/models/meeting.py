import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_uuid = Column(String(36), unique=True, nullable=False)
    meeting_id = Column(String(12), unique=True, nullable=False)
    title = Column(String(200), nullable=False, default="My Meeting")
    description = Column(String(1000), nullable=True)
    host_name = Column(String(100), nullable=False, default="John Doe")
    host_email = Column(String(200), nullable=True)
    start_time = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, index=True)
    duration_minutes = Column(Integer, nullable=False, default=60)
    passcode = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="upcoming", index=True)
    meeting_type = Column(String(20), nullable=False, default="instant")
    is_recurring = Column(Boolean, default=False)
    waiting_room_enabled = Column(Boolean, default=False)
    host_video = Column(Boolean, default=True)
    participant_video = Column(Boolean, default=True)
    invite_link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    participants = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage",
        back_populates="meeting",
        cascade="all, delete-orphan"
    )

    @property
    def participant_count(self) -> int:
        return len(self.participants) if self.participants else 0

    def __repr__(self):
        return f"<Meeting(id={self.id}, meeting_id='{self.meeting_id}', title='{self.title}', status='{self.status}')>"
