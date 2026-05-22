import logging
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.meeting import Meeting
from models.chat_message import ChatMessage
from schemas.meeting import (
    MeetingCreate,
    InstantMeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
    ValidateMeetingResponse,
)
from schemas.chat_message import ChatMessageCreate, ChatMessageResponse
import services.meeting_service as meeting_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/meetings",
    tags=["meetings"]
)

@router.get("/", response_model=MeetingListResponse)
def get_meetings(
    status_filter: Optional[Literal["upcoming", "previous", "all"]] = "all",
    db: Session = Depends(get_db)
):
    """
    Returns lists of meetings filtered by status, along with total counts.
    """
    logger.info(f"GET /api/meetings/ status_filter={status_filter}")
    
    all_meetings = meeting_service.get_all_meetings(db)
    upcoming_meetings = meeting_service.get_upcoming_meetings(db)
    previous_meetings = meeting_service.get_previous_meetings(db)
    
    if status_filter == "upcoming":
        filtered = upcoming_meetings
    elif status_filter == "previous":
        filtered = previous_meetings
    else:
        filtered = all_meetings
        
    return MeetingListResponse(
        meetings=filtered,
        total=len(all_meetings),
        upcoming_count=len(upcoming_meetings),
        previous_count=len(previous_meetings)
    )

@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming(db: Session = Depends(get_db)):
    """
    Returns only upcoming/scheduled/live meetings.
    """
    logger.info("GET /api/meetings/upcoming")
    return meeting_service.get_upcoming_meetings(db)

@router.get("/recent", response_model=List[MeetingResponse])
def get_recent(db: Session = Depends(get_db)):
    """
    Returns last 5 meetings (live, ended, or past) ordered by start_time desc (for dashboard tables).
    """
    logger.info("GET /api/meetings/recent")
    import datetime
    now = datetime.datetime.utcnow()
    meetings = db.query(Meeting).filter(
        (Meeting.status == "ended") |
        (Meeting.status == "live") |
        (Meeting.start_time <= now)
    ).order_by(Meeting.start_time.desc()).limit(5).all()
    return meetings

@router.get("/previous", response_model=List[MeetingResponse])
def get_previous(db: Session = Depends(get_db)):
    """
    Returns past meetings that have ended or happened in the past.
    """
    logger.info("GET /api/meetings/previous")
    return meeting_service.get_previous_meetings(db)

@router.get("/{meeting_uuid}/messages", response_model=List[ChatMessageResponse])
def get_meeting_messages(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Retrieves all chat messages for a specific meeting room.
    """
    logger.info(f"GET /api/meetings/{meeting_uuid}/messages")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    messages = db.query(ChatMessage).filter(ChatMessage.meeting_id == db_meeting.id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.post("/{meeting_uuid}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def create_meeting_message(meeting_uuid: str, data: ChatMessageCreate, db: Session = Depends(get_db)):
    """
    Saves a new chat message to the database for a meeting.
    """
    logger.info(f"POST /api/meetings/{meeting_uuid}/messages from {data.sender}")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    db_message = ChatMessage(
        meeting_id=db_meeting.id,
        sender=data.sender,
        text=data.text
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/{meeting_uuid}", response_model=MeetingResponse)
def get_meeting_details(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Fetches details of a single meeting by UUID.
    """
    logger.info(f"GET /api/meetings/{meeting_uuid}")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    return db_meeting

@router.get("/{meeting_id}/validate", response_model=ValidateMeetingResponse)
def validate_meeting_id(meeting_id: str, db: Session = Depends(get_db)):
    """
    Validates a 10-digit meeting ID for joining.
    Always returns 200 HTTP status with valid true/false.
    """
    logger.info(f"GET /api/meetings/{meeting_id}/validate")
    val_res = meeting_service.validate_meeting(db, meeting_id)
    meeting = val_res.get("meeting")
    
    if val_res["valid"] and meeting:
        return ValidateMeetingResponse(
            valid=True,
            meeting=meeting,
            message="Meeting is valid and active"
        )
    return ValidateMeetingResponse(
        valid=False,
        meeting=None,
        message="Meeting not found or has already ended"
    )

@router.post("/instant", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant(data: InstantMeetingCreate, db: Session = Depends(get_db)):
    """
    Creates a live instant meeting.
    """
    logger.info("POST /api/meetings/instant")
    try:
        return meeting_service.create_instant_meeting(db, data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create instant meeting: {str(e)}"
        )

@router.post("/schedule", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled(data: MeetingCreate, db: Session = Depends(get_db)):
    """
    Creates a scheduled meeting.
    """
    logger.info(f"POST /api/meetings/schedule - {data.title}")
    try:
        return meeting_service.create_scheduled_meeting(db, data)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to schedule meeting: {str(e)}"
        )

@router.patch("/{meeting_uuid}", response_model=MeetingResponse)
def update_existing_meeting(
    meeting_uuid: str,
    data: MeetingUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates meeting options.
    """
    logger.info(f"PATCH /api/meetings/{meeting_uuid}")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
        
    try:
        updated = meeting_service.update_meeting(db, db_meeting.id, data)
        return updated
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

@router.delete("/{meeting_uuid}")
def delete_existing_meeting(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Deletes meeting from DB.
    """
    logger.info(f"DELETE /api/meetings/{meeting_uuid}")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    meeting_service.delete_meeting(db, db_meeting.id)
    return {"message": "Meeting deleted successfully"}

@router.post("/{meeting_uuid}/end", response_model=MeetingResponse)
async def end_active_meeting(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Ends a meeting manually.
    """
    logger.info(f"POST /api/meetings/{meeting_uuid}/end")
    db_meeting = meeting_service.get_meeting_by_uuid(db, meeting_uuid)
    if not db_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Broadcast to all participants that meeting has ended
    try:
        from routers.websocket import manager
        await manager.broadcast_to_room(
            meeting_uuid,
            {
                "type": "meeting_ended",
                "sender_id": 0,
                "data": {}
            }
        )
    except Exception as e:
        logger.error(f"Failed to broadcast meeting_ended event: {str(e)}")

    return meeting_service.end_meeting(db, db_meeting.id)
