import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=True)
    role = Column(String(20), nullable=False, default="participant")
    is_muted = Column(Boolean, default=False)
    video_on = Column(Boolean, default=True)
    approved = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    avatar_color = Column(String(7), default="#0B5CFF")

    # Relationships
    meeting = relationship("Meeting", back_populates="participants")

    def __repr__(self):
        return f"<Participant(id={self.id}, name='{self.name}', role='{self.role}')>"
