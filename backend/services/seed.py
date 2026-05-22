import datetime
import logging
import random
from sqlalchemy.orm import Session
from models.meeting import Meeting
from models.participant import Participant
from utils.id_generator import (
    generate_meeting_id,
    generate_meeting_uuid,
    generate_passcode,
    generate_invite_link,
    generate_avatar_color,
)

logger = logging.getLogger(__name__)

def seed_database(db: Session) -> None:
    """
    Populates the database with initial structured mockup data if the meetings table is empty.
    """
    # 1. Check if the database has already been seeded
    meeting_count = db.query(Meeting).count()
    if meeting_count > 0:
        logger.info("Database already contains data. Skipping seeding.")
        return

    logger.info("Seeding database with sample meetings and participants...")
    
    now = datetime.datetime.utcnow()
    
    # 2. Define meeting seed profiles
    meetings_to_seed = [
        # Upcoming meetings
        {
            "title": "Weekly Team Standup",
            "start_time": now + datetime.timedelta(hours=2),
            "duration_minutes": 30,
            "meeting_type": "scheduled",
            "status": "upcoming",
            "passcode": "standup",
            "description": "Daily sync for the engineering team"
        },
        {
            "title": "Product Demo — Q2 Features",
            "start_time": now + datetime.timedelta(days=1),
            "duration_minutes": 60,
            "meeting_type": "scheduled",
            "status": "upcoming",
            "passcode": "demo2024",
            "description": "Live demo of Q2 product features for stakeholders"
        },
        {
            "title": "Design Review Session",
            "start_time": now + datetime.timedelta(days=2),
            "duration_minutes": 90,
            "meeting_type": "scheduled",
            "status": "upcoming",
            "passcode": "design1",
            "description": "Reviewing Figma mockups for the whiteboard feature"
        },
        {
            "title": "1:1 with Manager",
            "start_time": now + datetime.timedelta(days=3),
            "duration_minutes": 30,
            "meeting_type": "scheduled",
            "status": "upcoming",
            "passcode": None,
            "description": "Weekly status sync"
        },
        # Previous meetings
        {
            "title": "Sprint Planning — Sprint 24",
            "start_time": now - datetime.timedelta(days=1),
            "duration_minutes": 120,
            "meeting_type": "scheduled",
            "status": "ended",
            "passcode": None,
            "description": "Sprint planning and task estimation"
        },
        {
            "title": "All Hands Meeting",
            "start_time": now - datetime.timedelta(days=3),
            "duration_minutes": 60,
            "meeting_type": "scheduled",
            "status": "ended",
            "passcode": None,
            "description": "Company-wide all hands for Q1 results"
        },
        {
            "title": "Onboarding Session",
            "start_time": now - datetime.timedelta(weeks=1),
            "duration_minutes": 45,
            "meeting_type": "scheduled",
            "status": "ended",
            "passcode": None,
            "description": "Welcome onboarding call for new hires"
        },
        {
            "title": "Tech Interview — Backend Role",
            "start_time": now - datetime.timedelta(weeks=2),
            "duration_minutes": 60,
            "meeting_type": "scheduled",
            "status": "ended",
            "passcode": None,
            "description": "System design round for candidates"
        }
    ]
    
    participants_pool = [
        "Sarah Chen", 
        "Mike Johnson", 
        "Priya Patel",
        "Alex Turner", 
        "Emma Wilson", 
        "Raj Kumar", 
        "Lisa Zhang"
    ]
    
    total_meetings = 0
    total_participants = 0
    
    try:
        for seed in meetings_to_seed:
            # Generate unique ID and code
            uuid_str = generate_meeting_uuid()
            meeting_id = generate_meeting_id()
            passcode = seed["passcode"] if seed["passcode"] else generate_passcode()
            invite_link = generate_invite_link(meeting_id)
            
            # Create meeting instance
            db_meeting = Meeting(
                meeting_uuid=uuid_str,
                meeting_id=meeting_id,
                title=seed["title"],
                description=seed["description"],
                host_name="John Doe",
                host_email="john.doe@example.com",
                start_time=seed["start_time"],
                duration_minutes=seed["duration_minutes"],
                passcode=passcode,
                status=seed["status"],
                meeting_type=seed["meeting_type"],
                invite_link=invite_link
            )
            
            db.add(db_meeting)
            db.flush()  # Populate db_meeting.id
            total_meetings += 1
            
            # Create host participant (always John Doe)
            host = Participant(
                meeting_id=db_meeting.id,
                name="John Doe",
                email="john.doe@example.com",
                role="host",
                is_muted=False,
                video_on=True,
                avatar_color=generate_avatar_color("John Doe")
            )
            db.add(host)
            total_participants += 1
            
            # Select 1 to 3 additional names randomly from our pool
            num_extras = random.randint(1, 3)
            sampled_names = random.sample(participants_pool, num_extras)
            
            for guest_name in sampled_names:
                guest = Participant(
                    meeting_id=db_meeting.id,
                    name=guest_name,
                    email=f"{guest_name.lower().replace(' ', '.')}@example.com",
                    role="participant",
                    is_muted=random.choice([True, False]),
                    video_on=random.choice([True, False]),
                    avatar_color=generate_avatar_color(guest_name)
                )
                db.add(guest)
                total_participants += 1
                
        db.commit()
        print(f"[SUCCESS] Database seeded with {total_meetings} meetings and {total_participants} participants")
        logger.info(f"Seeding completed successfully: {total_meetings} meetings and {total_participants} participants")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {str(e)}")
        raise e
