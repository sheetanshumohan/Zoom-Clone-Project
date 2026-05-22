# Zoom Clone — Backend API

## Tech Stack
- Python 3.11
- FastAPI
- SQLite (via SQLAlchemy ORM)
- Pydantic v2
- Uvicorn

## Setup & Run

### 1. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### 4. Run the server
```bash
python main.py
# OR
uvicorn main:app --reload --port 8000
```

### 5. API Documentation
- Visit http://localhost:8000/docs for Swagger UI
- Visit http://localhost:8000/redoc for ReDoc

## Database
- SQLite file: `zoom_clone.db` (auto-created on first run)
- Auto-seeded with 8 sample meetings on first startup
- To reset: delete `zoom_clone.db` and restart

## API Endpoints Summary

### Meetings Router (`/api/meetings`)

| Method | Path | Description |
| :--- | :--- | :--- |
| **GET** | `/api/meetings/` | Returns all meetings (optional status query parameter filter) |
| **GET** | `/api/meetings/upcoming` | Returns all upcoming/scheduled/live meetings |
| **GET** | `/api/meetings/recent` | Returns last 5 created meetings |
| **GET** | `/api/meetings/previous` | Returns ended or past meetings |
| **GET** | `/api/meetings/{meeting_uuid}` | Fetch a single meeting detail by its unique UUID |
| **GET** | `/api/meetings/{meetingId}/validate` | Validates a meeting by its 10-digit ID or UUID |
| **POST** | `/api/meetings/instant` | Instantly initializes and starts a new meeting |
| **POST** | `/api/meetings/schedule` | Schedules a new meeting with a schema |
| **PATCH** | `/api/meetings/{meeting_uuid}` | Updates specific fields of a scheduled meeting |
| **DELETE** | `/api/meetings/{meeting_uuid}` | Deletes/cancels a scheduled meeting |
| **POST** | `/api/meetings/{meeting_uuid}/end` | Ends a meeting and changes status to "ended" |

### Participants Router (`/api/meetings/{meeting_uuid}/participants`)

| Method | Path | Description |
| :--- | :--- | :--- |
| **GET** | `/api/meetings/{meeting_uuid}/participants` | Lists all active participants inside a meeting |
| **POST** | `/api/meetings/{meeting_uuid}/participants` | Adds a new participant to the meeting database |
| **DELETE** | `/api/meetings/{meeting_uuid}/participants/{participant_id}` | Removes/kicks a participant from the meeting |
| **PATCH** | `/api/meetings/{meeting_uuid}/participants/{participant_id}/mute` | Toggles mute state (`is_muted`) of a participant |
| **PATCH** | `/api/meetings/{meeting_uuid}/participants/mute-all` | Mutes all participants except the host |

## Database Schema

### 1. `Meeting` Table
- `id` (Integer, Primary Key): Autoincrement internal ID.
- `meeting_uuid` (String, Unique Index): Unique UUID key used for secure route links.
- `meeting_id` (String, Unique Index): Formatted 10-digit human-friendly sharing ID.
- `title` (String, max 200 chars): Title of the meeting.
- `description` (String, Nullable): Description text.
- `host_name` (String): Display name of the meeting host.
- `start_time` (DateTime): UTC time for the meeting start.
- `duration_minutes` (Integer): Planned duration.
- `passcode` (String, Nullable): Alphanumeric passcode.
- `waiting_room_enabled` (Boolean): Waiting room protection toggle.
- `host_video` (Boolean): Starts with host video enabled.
- `participant_video` (Boolean): Starts with participant video enabled.
- `status` (String): One of `upcoming`, `scheduled`, `live`, `ended`.
- `meeting_type` (String): One of `scheduled`, `instant`, `personal`.
- `is_recurring` (Boolean): Recurring meeting flag.
- `created_at` (DateTime): Timestamp of creation.
- `updated_at` (DateTime): Timestamp of last update.

### 2. `Participant` Table
- `id` (Integer, Primary Key): Autoincrement participant ID.
- `meeting_id` (Integer, Foreign Key -> Meeting.id): Associated meeting database ID.
- `name` (String): Participant display name.
- `email` (String, Nullable): Optional participant email.
- `role` (String): Either `host` or `participant`.
- `is_muted` (Boolean): Audio muted status indicator.
- `video_on` (Boolean): Video camera status indicator.
- `avatar_color` (String): Deterministic Tailwind background color.
- `joined_at` (DateTime): Timestamp of joining.

## Assumptions
- No real authentication: Default user context defaults to "John Doe"
- No real video/audio streams: The meeting room visual tiles simulate status controls
- Chat feature is UI-simulated
- All times are handled and persisted in UTC
