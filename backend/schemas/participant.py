from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Literal

class ParticipantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=200)
    role: Literal["host", "participant"] = "participant"
    video_on: bool = True
    approved: Optional[bool] = True

class ParticipantResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role: str
    is_muted: bool
    video_on: bool
    approved: bool
    joined_at: datetime
    avatar_color: str

    model_config = ConfigDict(from_attributes=True)
