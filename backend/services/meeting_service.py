import datetime
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from models.meeting import Meeting
from models.participant import Participant
from schemas.meeting import MeetingCreate, InstantMeetingCreate, MeetingUpdate
from utils.id_generator import (
    generate_meeting_id,
    generate_meeting_uuid,
    generate_passcode,
    generate_invite_link,
    generate_avatar_color,
)

logger = logging.getLogger(__name__)

def get_all_meetings(db: Session) -> List[Meeting]:
    """
    Returns all meetings ordered by start_time descending.
    """
    logger.info("Fetching all meetings from DB")
    return db.query(Meeting).order_by(Meeting.start_time.desc()).all()

def get_upcoming_meetings(db: Session) -> List[Meeting]:
    """
    Returns upcoming/scheduled/live meetings.
    Ordered by start_time ascending.
    """
    logger.info("Fetching upcoming meetings")
    import datetime
    now = datetime.datetime.utcnow()
    grace_time = now - datetime.timedelta(hours=2)
    live_limit = now - datetime.timedelta(hours=4)
    return db.query(Meeting).filter(
        ((Meeting.status == "live") & (Meeting.start_time >= live_limit)) |
        ((Meeting.status.in_(["upcoming", "scheduled"])) & (Meeting.start_time >= grace_time))
    ).order_by(Meeting.start_time.asc()).all()

def get_previous_meetings(db: Session) -> List[Meeting]:
    """
    Returns meetings that have ended or scheduled in the past.
    Ordered by start_time descending.
    """
    logger.info("Fetching previous meetings")
    import datetime
    now = datetime.datetime.utcnow()
    grace_time = now - datetime.timedelta(hours=2)
    live_limit = now - datetime.timedelta(hours=4)
    return db.query(Meeting).filter(
        (Meeting.status == "ended") |
        ((Meeting.status == "live") & (Meeting.start_time < live_limit)) |
        ((Meeting.status.in_(["upcoming", "scheduled"])) & (Meeting.start_time < grace_time))
    ).order_by(Meeting.start_time.desc()).all()

def get_meeting_by_id(db: Session, meeting_id: int) -> Optional[Meeting]:
    """
    Retrieves a single meeting by its primary key ID.
    """
    logger.info(f"Fetching meeting by primary ID: {meeting_id}")
    return db.query(Meeting).filter(Meeting.id == meeting_id).first()

def get_meeting_by_uuid(db: Session, meeting_uuid: str) -> Optional[Meeting]:
    """
    Retrieves a single meeting by its internal UUID. Fallback to 10-digit meeting ID lookup.
    """
    logger.info(f"Fetching meeting by UUID/ID: {meeting_uuid}")
    db_meeting = db.query(Meeting).filter(Meeting.meeting_uuid == meeting_uuid).first()
    if db_meeting:
        return db_meeting

    clean_id = meeting_uuid.replace("-", "").strip()
    if clean_id.isdigit():
        logger.info(f"UUID lookup failed. Trying 10-digit ID: {clean_id}")
        return db.query(Meeting).filter(Meeting.meeting_id == clean_id).first()
    return None

def get_meeting_by_meeting_id(db: Session, meeting_id: str) -> Optional[Meeting]:
    """
    Retrieves a single meeting by its 10-digit unique meeting_id (removing dash formatting).
    """
    clean_id = meeting_id.replace("-", "").strip()
    logger.info(f"Fetching meeting by 10-digit ID: {clean_id}")
    return db.query(Meeting).filter(Meeting.meeting_id == clean_id).first()

def create_instant_meeting(db: Session, data: InstantMeetingCreate) -> Meeting:
    """
    Creates or reuses/resets a meeting (e.g. personal meeting room),
    initializes the host, and commits to the database.
    """
    meeting_id = data.meeting_id
    meeting_type = data.meeting_type or "instant"
    
    if meeting_id:
        # Clean PMI
        meeting_id = meeting_id.replace("-", "").strip()
        logger.info(f"Creating/starting specific meeting for host: {data.host_name} with ID: {meeting_id}")
        db_meeting = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    else:
        db_meeting = None

    if db_meeting:
        # Reset and reuse existing meeting (e.g. personal room)
        logger.info(f"Reusing existing meeting {meeting_id}")
        db_meeting.status = "live"
        db_meeting.host_name = data.host_name
        db_meeting.start_time = datetime.datetime.utcnow()
        if data.passcode:
            db_meeting.passcode = data.passcode
        db_meeting.waiting_room_enabled = data.waiting_room_enabled or False
        db_meeting.host_video = data.host_video
        db_meeting.participant_video = data.participant_video
        db_meeting.updated_at = datetime.datetime.utcnow()
        
        try:
            # Delete old participants
            db.query(Participant).filter(Participant.meeting_id == db_meeting.id).delete()
            db.flush()
            
            # Add host as primary participant
            host_participant = Participant(
                meeting_id=db_meeting.id,
                name=data.host_name,
                role="host",
                video_on=data.host_video,
                avatar_color=generate_avatar_color(data.host_name)
            )
            db.add(host_participant)
            db.commit()
            db.refresh(db_meeting)
            logger.info(f"Successfully restarted meeting {meeting_id}")
            return db_meeting
        except Exception as e:
            db.rollback()
            logger.error(f"Error restarting meeting: {str(e)}")
            raise e
    else:
        # Create a new meeting (either instant or a new personal room entry)
        if not meeting_id:
            while True:
                meeting_id = generate_meeting_id()
                existing = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
                if not existing:
                    break
        
        meeting_uuid = generate_meeting_uuid()
        passcode = None if meeting_type == "instant" else (data.passcode if data.passcode else generate_passcode())
        invite_link = generate_invite_link(meeting_id)
        title = f"{data.host_name}'s Personal Meeting Room" if meeting_type == "personal" else "Instant Meeting"
        
        db_meeting = Meeting(
            meeting_uuid=meeting_uuid,
            meeting_id=meeting_id,
            title=title,
            host_name=data.host_name,
            start_time=datetime.datetime.utcnow(),
            duration_minutes=60,
            passcode=passcode,
            status="live",
            meeting_type=meeting_type,
            waiting_room_enabled=data.waiting_room_enabled or False,
            host_video=data.host_video,
            participant_video=data.participant_video,
            invite_link=invite_link
        )
        
        try:
            db.add(db_meeting)
            db.flush()
            
            # Add host as primary participant
            host_participant = Participant(
                meeting_id=db_meeting.id,
                name=data.host_name,
                role="host",
                video_on=data.host_video,
                avatar_color=generate_avatar_color(data.host_name)
            )
            db.add(host_participant)
            db.commit()
            db.refresh(db_meeting)
            logger.info(f"Successfully created meeting {meeting_id}")
            return db_meeting
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating meeting: {str(e)}")
            raise e

def create_scheduled_meeting(db: Session, data: MeetingCreate) -> Meeting:
    """
    Creates a scheduled meeting, initializes the host, and commits to the database.
    """
    logger.info(f"Creating scheduled meeting: {data.title}")
    meeting_uuid = generate_meeting_uuid()
    
    # Generate unique 10-digit meeting ID
    while True:
        meeting_id = generate_meeting_id()
        existing = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
        if not existing:
            break
            
    passcode = data.passcode if data.passcode else generate_passcode()
    invite_link = generate_invite_link(meeting_id)
    
    db_meeting = Meeting(
        meeting_uuid=meeting_uuid,
        meeting_id=meeting_id,
        title=data.title,
        description=data.description,
        host_name=data.host_name,
        start_time=data.start_time,
        duration_minutes=data.duration_minutes,
        passcode=passcode,
        status="upcoming",
        meeting_type="scheduled",
        is_recurring=data.is_recurring,
        waiting_room_enabled=data.waiting_room_enabled,
        host_video=data.host_video,
        participant_video=data.participant_video,
        invite_link=invite_link
    )
    
    try:
        db.add(db_meeting)
        db.flush()  # Populate db_meeting.id
        
        # Add host as primary participant
        host_participant = Participant(
            meeting_id=db_meeting.id,
            name=data.host_name,
            role="host",
            video_on=data.host_video,
            avatar_color=generate_avatar_color(data.host_name)
        )
        db.add(host_participant)
        db.commit()
        db.refresh(db_meeting)
        logger.info(f"Successfully scheduled meeting {meeting_id}")
        return db_meeting
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating scheduled meeting: {str(e)}")
        raise e

def update_meeting(db: Session, meeting_id: int, data: MeetingUpdate) -> Optional[Meeting]:
    """
    Updates meeting settings for non-None variables and updates changed timestamp.
    """
    logger.info(f"Updating meeting with primary ID: {meeting_id}")
    db_meeting = get_meeting_by_id(db, meeting_id)
    if not db_meeting:
        logger.warning(f"Meeting {meeting_id} not found for updates")
        return None
        
    update_dict = data.model_dump(exclude_unset=True)
    try:
        for key, val in update_dict.items():
            setattr(db_meeting, key, val)
        db_meeting.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(db_meeting)
        logger.info(f"Successfully updated meeting {meeting_id}")
        return db_meeting
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating meeting {meeting_id}: {str(e)}")
        raise e

def delete_meeting(db: Session, meeting_id: int) -> bool:
    """
    Deletes meeting object, triggers cascade delete on participants, and commits.
    """
    logger.info(f"Deleting meeting with primary ID: {meeting_id}")
    db_meeting = get_meeting_by_id(db, meeting_id)
    if not db_meeting:
        logger.warning(f"Meeting {meeting_id} not found for deletion")
        return False
        
    try:
        db.delete(db_meeting)
        db.commit()
        logger.info(f"Successfully deleted meeting {meeting_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting meeting {meeting_id}: {str(e)}")
        raise e

def ensure_meeting_joinable(db: Session, meeting: Meeting) -> Meeting:
    """
    Once ended, a meeting cannot be rejoined.
    """
    return meeting


def validate_meeting(db: Session, meeting_id: str) -> dict:
    """
    Validates if meeting exists and is active.
    """
    logger.info(f"Validating meeting: {meeting_id}")
    db_meeting = get_meeting_by_meeting_id(db, meeting_id)
    if not db_meeting:
        logger.warning(f"Validation failed for meeting {meeting_id}")
        return {"valid": False, "meeting": None}

    db_meeting = ensure_meeting_joinable(db, db_meeting)
    if db_meeting.status == "ended":
        logger.warning(f"Validation failed for meeting {meeting_id}")
        return {"valid": False, "meeting": None}
    logger.info(f"Validation successful for meeting {meeting_id}")
    return {"valid": True, "meeting": db_meeting}

def end_meeting(db: Session, meeting_id: int) -> Optional[Meeting]:
    """
    Updates meeting status to 'ended'.
    """
    logger.info(f"Ending meeting with primary ID: {meeting_id}")
    db_meeting = get_meeting_by_id(db, meeting_id)
    if not db_meeting:
        logger.warning(f"Meeting {meeting_id} not found to end")
        return None
        
    try:
        db_meeting.status = "ended"
        now = datetime.datetime.utcnow()
        db_meeting.updated_at = now
        if db_meeting.start_time > now:
            db_meeting.start_time = now
        db.commit()
        db.refresh(db_meeting)
        logger.info(f"Successfully ended meeting {meeting_id}")
        return db_meeting
    except Exception as e:
        db.rollback()
        logger.error(f"Error ending meeting {meeting_id}: {str(e)}")
        raise e
