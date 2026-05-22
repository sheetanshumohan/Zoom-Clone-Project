import random
import string
import uuid
import hashlib

def generate_meeting_id() -> str:
    """
    Generates a unique 10-digit numeric string.
    Ensures the generated number is in range [1000000000, 9999999999] so it does not start with 0.
    """
    return str(random.randint(1000000000, 9999999999))

def format_meeting_id(raw_id: str) -> str:
    """
    Formats a raw 10-digit meeting ID string from XXXXXXXXXX to XXX-XXX-XXXX.
    """
    clean_id = raw_id.replace("-", "").strip()
    if len(clean_id) != 10:
        return clean_id  # Fallback if invalid length
    return f"{clean_id[0:3]}-{clean_id[3:6]}-{clean_id[6:10]}"

def generate_passcode() -> str:
    """
    Generates a random 6-character alphanumeric string (mixed case + digits).
    """
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=6))

def generate_meeting_uuid() -> str:
    """
    Generates a random UUID version 4 string.
    """
    return str(uuid.uuid4())

def generate_invite_link(meeting_id: str, base_url: str = "http://localhost:3000") -> str:
    """
    Generates the invitation URL for the frontend application.
    """
    # Remove dashes if any to normalize query parameter
    clean_id = meeting_id.replace("-", "").strip()
    return f"{base_url}/meeting/join?meetingId={clean_id}"

def generate_avatar_color(name: str) -> str:
    """
    Deterministically yields a color from a selected professional palette.
    Always yields the exact same hex color code for the same name input.
    """
    colors = [
        "#0B5CFF",  # Zoom blue
        "#7C3AED",  # Purple
        "#059669",  # Emerald
        "#DC2626",  # Red
        "#D97706",  # Amber
        "#0891B2",  # Cyan
        "#BE185D",  # Pink
        "#4F46E5"   # Indigo
    ]
    # Simple hash of string characters
    hash_val = int(hashlib.md5(name.encode("utf-8")).hexdigest(), 16)
    return colors[hash_val % len(colors)]
