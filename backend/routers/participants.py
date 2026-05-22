import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.meeting import Meeting
from models.participant import Participant
from schemas.participant import ParticipantCreate, ParticipantResponse
from utils.id_generator import generate_avatar_color
import services.meeting_service as meeting_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/meetings/{meeting_uuid}/participants",
    tags=["participants"]
)

class MuteToggleInput(BaseModel):
    is_muted: bool

@router.get("/", response_model=List[ParticipantResponse])
def list_participants(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Lists all participants for a specific meeting UUID.
    """
    logger.info(f"GET /api/meetings/{meeting_uuid}/participants")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    return meeting.participants

@router.post("/", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
def add_participant(
    meeting_uuid: str,
    data: ParticipantCreate,
    db: Session = Depends(get_db)
):
    """
    Adds a participant to a meeting. Generates avatar color deterministically.
    """
    logger.info(f"POST /api/meetings/{meeting_uuid}/participants - adding {data.name}")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    meeting = meeting_service.ensure_meeting_joinable(db, meeting)
    if meeting.status == "ended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add participant. The meeting has already ended."
        )

    # Transition scheduled/upcoming meetings to live and set start_time to now (actual conduct time)
    if meeting.status in ["scheduled", "upcoming"]:
        try:
            import datetime
            meeting.status = "live"
            meeting.start_time = datetime.datetime.utcnow()
            db.commit()
            db.refresh(meeting)
            logger.info(f"Meeting {meeting.meeting_id} transitioned to live status at {meeting.start_time}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error transitioning meeting to live status: {str(e)}")

    # Determine initial approval state
    is_approved = True
    if meeting.waiting_room_enabled and data.role != "host":
        is_approved = False

    # Reuse existing participant row when rejoining with the same display name and role
    existing = db.query(Participant).filter(
        Participant.meeting_id == meeting.id,
        Participant.name == data.name,
        Participant.role == data.role,
    ).first()
    if existing:
        logger.info(f"Participant {existing.id} rejoined meeting {meeting.id} (role: {data.role})")
        try:
            existing.video_on = data.video_on
            existing.approved = is_approved
            db.commit()
            db.refresh(existing)
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating rejoining participant: {str(e)}")
        return existing

    # Generate deterministic color
    color = generate_avatar_color(data.name)

    db_participant = Participant(
        meeting_id=meeting.id,
        name=data.name,
        email=data.email,
        role=data.role,
        video_on=data.video_on,
        approved=is_approved,
        avatar_color=color
    )
    
    try:
        db.add(db_participant)
        db.commit()
        db.refresh(db_participant)
        logger.info(f"Successfully added participant {db_participant.id} to meeting {meeting.id}")
        return db_participant
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding participant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not add participant to database"
        )

@router.delete("/{participant_id}")
def remove_participant(
    meeting_uuid: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    """
    Removes a participant from a meeting.
    """
    logger.info(f"DELETE /api/meetings/{meeting_uuid}/participants/{participant_id}")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
        
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id
    ).first()
    
    if not participant:
        logger.info(f"Participant {participant_id} not found in meeting {meeting_uuid}, already removed.")
        return {"message": "Participant already removed"}
        
    try:
        db.delete(participant)
        db.commit()
        logger.info(f"Successfully removed participant {participant_id}")
        
        # If no participants remain, mark meeting as ended
        remaining_count = db.query(Participant).filter(Participant.meeting_id == meeting.id).count()
        if remaining_count == 0:
            meeting.status = "ended"
            db.commit()
            logger.info(f"Meeting {meeting.id} has no participants left. Status set to ended.")

        return {"message": "Participant removed"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing participant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete participant from database"
        )

@router.patch("/{participant_id}/mute", response_model=ParticipantResponse)
def toggle_mute(
    meeting_uuid: str,
    participant_id: int,
    body: MuteToggleInput,
    db: Session = Depends(get_db)
):
    """
    Toggles the mute status of a participant.
    """
    logger.info(f"PATCH /api/meetings/{meeting_uuid}/participants/{participant_id}/mute to {body.is_muted}")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
        
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this meeting"
        )
        
    try:
        participant.is_muted = body.is_muted
        db.commit()
        db.refresh(participant)
        logger.info(f"Successfully toggled mute for participant {participant_id}")
        return participant
    except Exception as e:
        db.rollback()
        logger.error(f"Error toggling participant mute: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update participant mute status"
        )

@router.patch("/mute-all")
def mute_all_participants(meeting_uuid: str, db: Session = Depends(get_db)):
    """
    Mutes all participants in a meeting except the host (host control).
    """
    logger.info(f"PATCH /api/meetings/{meeting_uuid}/participants/mute-all")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
        
    try:
        updated_count = db.query(Participant).filter(
            Participant.meeting_id == meeting.id,
            Participant.role != "host"
        ).update({Participant.is_muted: True}, synchronize_session=False)
        db.commit()
        logger.info(f"Successfully muted {updated_count} participants in meeting {meeting.id}")
        return {"message": "All participants muted", "count": updated_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Error muting all participants: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not mute participants"
        )

@router.post("/{participant_id}/admit", response_model=ParticipantResponse)
async def admit_participant(
    meeting_uuid: str,
    participant_id: int,
    db: Session = Depends(get_db)
):
    """
    Admits a participant from the waiting room.
    """
    logger.info(f"POST /api/meetings/{meeting_uuid}/participants/{participant_id}/admit")
    meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
        
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.meeting_id == meeting.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
        
    try:
        participant.approved = True
        db.commit()
        db.refresh(participant)
        
        # Broadcast admit event via WebSocket connection manager
        from routers.websocket import manager
        await manager.broadcast_to_room(
            meeting_uuid,
            {
                "type": "waiting_room_admit",
                "sender_id": participant_id,
                "data": {"participant_id": participant_id}
            }
        )
        
        logger.info(f"Successfully admitted participant {participant_id}")
        return participant
    except Exception as e:
        db.rollback()
        logger.error(f"Error admitting participant: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not admit participant"
        )
