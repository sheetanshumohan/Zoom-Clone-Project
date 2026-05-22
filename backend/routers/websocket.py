import logging
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # meeting_uuid -> { participant_id -> websocket }
        self.active_connections: Dict[str, Dict[int, WebSocket]] = {}

    async def connect(self, meeting_uuid: str, participant_id: int, websocket: WebSocket):
        await websocket.accept()
        if meeting_uuid not in self.active_connections:
            self.active_connections[meeting_uuid] = {}
        self.active_connections[meeting_uuid][participant_id] = websocket
        logger.info(f"WebSocket: Participant {participant_id} connected to meeting {meeting_uuid}")

    def disconnect(self, meeting_uuid: str, participant_id: int):
        if meeting_uuid in self.active_connections:
            if participant_id in self.active_connections[meeting_uuid]:
                del self.active_connections[meeting_uuid][participant_id]
                logger.info(f"WebSocket: Participant {participant_id} disconnected from meeting {meeting_uuid}")
            if not self.active_connections[meeting_uuid]:
                del self.active_connections[meeting_uuid]

    async def broadcast_to_room(self, meeting_uuid: str, message: dict, exclude_participant_id: int = None):
        if meeting_uuid in self.active_connections:
            for p_id, ws in list(self.active_connections[meeting_uuid].items()):
                if exclude_participant_id is None or p_id != exclude_participant_id:
                    try:
                        await ws.send_json(message)
                    except Exception as e:
                        logger.error(f"WebSocket: Error broadcasting to participant {p_id}: {str(e)}")

    async def send_to_participant(self, meeting_uuid: str, target_id: int, message: dict):
        if meeting_uuid in self.active_connections:
            ws = self.active_connections[meeting_uuid].get(target_id)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"WebSocket: Error sending direct message to {target_id}: {str(e)}")

manager = ConnectionManager()
router = APIRouter(tags=["websocket"])

@router.websocket("/api/meetings/{meeting_uuid}/ws/{participant_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_uuid: str, participant_id: int):
    await manager.connect(meeting_uuid, participant_id, websocket)
    
    # Broadcast join event to other peers
    await manager.broadcast_to_room(
        meeting_uuid,
        {
            "type": "participant_joined",
            "sender_id": participant_id,
            "data": {"participant_id": participant_id}
        },
        exclude_participant_id=participant_id
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            target_id = data.get("target_id")
            
            # Inject correct sender metadata
            data["sender_id"] = participant_id
            
            if target_id is not None:
                # Direct Peer WebRTC Signaling message (SDP, ICE)
                await manager.send_to_participant(meeting_uuid, int(target_id), data)
            else:
                # Room-wide broadcast (chat, reactions, mute/video status sync)
                await manager.broadcast_to_room(meeting_uuid, data, exclude_participant_id=participant_id)
                
    except WebSocketDisconnect:
        manager.disconnect(meeting_uuid, participant_id)

        # Clean up database participant row on disconnect
        from database import SessionLocal
        from models.participant import Participant
        from models.meeting import Meeting
        db = SessionLocal()
        try:
            participant = db.query(Participant).filter(
                Participant.id == participant_id
            ).first()
            if participant:
                meeting = participant.meeting
                db.delete(participant)
                db.commit()
                logger.info(f"WebSocketDisconnect: Cleaned up participant {participant_id} from DB")
                
                # Check if there are any participants left in the meeting
                if meeting:
                    remaining_count = db.query(Participant).filter(
                        Participant.meeting_id == meeting.id
                    ).count()
                    if remaining_count == 0:
                        meeting.status = "ended"
                        db.commit()
                        logger.info(f"WebSocketDisconnect: Meeting {meeting.id} has no participants left. Status set to ended.")
        except Exception as e:
            logger.error(f"WebSocketDisconnect: Error cleaning up participant {participant_id}: {str(e)}")
            db.rollback()
        finally:
            db.close()

        # Broadcast leave event
        await manager.broadcast_to_room(
            meeting_uuid,
            {
                "type": "participant_left",
                "sender_id": participant_id,
                "data": {"participant_id": participant_id}
            }
        )
