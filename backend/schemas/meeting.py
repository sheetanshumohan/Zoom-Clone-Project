from pydantic import BaseModel, Field, field_validator, field_serializer, ConfigDict
from datetime import datetime, timezone
from typing import Optional, List, Literal

class MeetingBase(BaseModel):
    title: str = Field(default="My Meeting", max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    host_name: str = Field("John Doe", max_length=100)
    duration_minutes: int = Field(60, ge=1, le=1440)
    passcode: Optional[str] = Field(None, max_length=20)
    waiting_room_enabled: bool = False
    host_video: bool = True
    participant_video: bool = True

    @field_validator("passcode")
    @classmethod
    def check_passcode_length(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and len(value) > 20:
            raise ValueError("Passcode cannot exceed 20 characters")
        return value

class MeetingCreate(MeetingBase):
    start_time: datetime
    meeting_type: Literal["scheduled"] = "scheduled"
    is_recurring: bool = False

    @field_validator("start_time")
    @classmethod
    def check_future_date(cls, value: datetime) -> datetime:
        now = datetime.now(value.tzinfo) if value.tzinfo else datetime.now()
        if value < now:
            raise ValueError("Meeting start time must be in the future")
        return value

class InstantMeetingCreate(BaseModel):
    host_name: str = Field("John Doe", max_length=100)
    host_video: bool = True
    participant_video: bool = True
    meeting_id: Optional[str] = None
    meeting_type: Optional[str] = "instant"
    passcode: Optional[str] = None
    waiting_room_enabled: Optional[bool] = False

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    passcode: Optional[str] = Field(None, max_length=20)
    waiting_room_enabled: Optional[bool] = None
    host_video: Optional[bool] = None
    participant_video: Optional[bool] = None

    @field_validator("start_time")
    @classmethod
    def check_future_date_update(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return value
        now = datetime.now(value.tzinfo) if value.tzinfo else datetime.now()
        if value < now:
            raise ValueError("Meeting start time must be in the future")
        return value

class MeetingResponse(BaseModel):
    id: int
    meeting_uuid: str
    meeting_id: str
    title: str
    description: Optional[str] = None
    host_name: str
    start_time: datetime
    duration_minutes: int
    passcode: Optional[str] = None
    status: str
    meeting_type: str
    is_recurring: bool
    waiting_room_enabled: bool
    host_video: bool
    participant_video: bool
    invite_link: Optional[str] = None
    participant_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("start_time", "created_at", "updated_at")
    def serialize_utc_datetime(self, value: datetime) -> str:
        """Naive DB datetimes are UTC; emit ISO-8601 with Z for correct client parsing."""
        if value.tzinfo is None:
            return value.isoformat() + "Z"
        return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

class MeetingListResponse(BaseModel):
    meetings: List[MeetingResponse]
    total: int
    upcoming_count: int
    previous_count: int

class ValidateMeetingResponse(BaseModel):
    valid: bool
    meeting: Optional[MeetingResponse] = None
    message: str
