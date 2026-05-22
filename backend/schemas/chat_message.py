from pydantic import BaseModel, Field, ConfigDict, field_serializer
from datetime import datetime, timezone

class ChatMessageBase(BaseModel):
    sender: str = Field(..., max_length=100)
    text: str = Field(..., max_length=2000)

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageResponse(ChatMessageBase):
    id: int
    meeting_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serialize_utc_datetime(self, value: datetime) -> str:
        if value.tzinfo is None:
            return value.isoformat() + "Z"
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
