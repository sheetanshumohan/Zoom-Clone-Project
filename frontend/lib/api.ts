import { Meeting, Participant, ScheduleMeetingInput } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export class ApiError extends Error {
  status?: number;
  info?: any;

  constructor(message: string, status?: number, info?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.info = info;
  }
}

// Map snake_case response to frontend camelCase structures
export function mapParticipant(raw: any): Participant {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    isMuted: raw.is_muted,
    videoOn: raw.video_on,
    joinedAt: raw.joined_at,
    avatarColor: raw.avatar_color,
    approved: raw.approved !== undefined ? raw.approved : true,
  };
}

export function mapMeeting(raw: any): Meeting {
  return {
    id: raw.id,
    meetingUuid: raw.meeting_uuid,
    meetingId: raw.meeting_id,
    title: raw.title,
    description: raw.description,
    hostName: raw.host_name,
    startTime: raw.start_time,
    durationMinutes: raw.duration_minutes,
    passcode: raw.passcode,
    status: raw.status,
    meetingType: raw.meeting_type,
    isRecurring: raw.is_recurring,
    waitingRoomEnabled: raw.waiting_room_enabled,
    hostVideo: raw.host_video,
    participantVideo: raw.participant_video,
    inviteLink: raw.invite_link,
    participantCount: raw.participant_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    participants: raw.participants ? raw.participants.map(mapParticipant) : undefined,
  };
}

// Fetch helper wrapper with CORS configurations and AbortSignal support
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let info;
      try {
        info = await response.json();
      } catch {
        info = null;
      }
      
      let errMsg = `HTTP error! Status: ${response.status}`;
      if (info) {
        if (typeof info.detail === "string") {
          errMsg = info.detail;
        } else if (Array.isArray(info.detail)) {
          errMsg = info.detail.map((err: any) => `${err.loc?.join(".") || "field"}: ${err.msg}`).join("; ");
        } else if (info.error) {
          errMsg = info.error;
        } else if (info.detail && typeof info.detail === "object") {
          errMsg = JSON.stringify(info.detail);
        }
      }

      throw new ApiError(
        errMsg,
        response.status,
        info
      );
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw error;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Connection to API failed");
  }
}

/* ==========================================================================
   MEETINGS ENDPOINTS
   ========================================================================== */

export async function getMeetings(signal?: AbortSignal): Promise<Meeting[]> {
  const res = await apiFetch<any>("/api/meetings/", { method: "GET", signal });
  // If backend returns MeetingListResponse: { meetings, total, upcoming_count, previous_count }
  if (res && !Array.isArray(res) && "meetings" in res) {
    return res.meetings.map(mapMeeting);
  }
  return Array.isArray(res) ? res.map(mapMeeting) : [];
}

export async function getUpcomingMeetings(signal?: AbortSignal): Promise<Meeting[]> {
  const res = await apiFetch<any[]>("/api/meetings/upcoming", { method: "GET", signal });
  return res.map(mapMeeting);
}

export async function getRecentMeetings(signal?: AbortSignal): Promise<Meeting[]> {
  const res = await apiFetch<any[]>("/api/meetings/recent", { method: "GET", signal });
  return res.map(mapMeeting);
}

export async function getPreviousMeetings(signal?: AbortSignal): Promise<Meeting[]> {
  const res = await apiFetch<any[]>("/api/meetings/previous", { method: "GET", signal });
  return res.map(mapMeeting);
}

export async function getMeetingById(uuid: string, signal?: AbortSignal): Promise<Meeting> {
  const res = await apiFetch<any>(`/api/meetings/${uuid}`, { method: "GET", signal });
  return mapMeeting(res);
}

export async function createInstantMeeting(
  hostName: string = "John Doe",
  hostVideo: boolean = true,
  participantVideo: boolean = true,
  meetingId?: string,
  meetingType?: string,
  passcode?: string,
  waitingRoomEnabled?: boolean,
  signal?: AbortSignal
): Promise<Meeting> {
  const res = await apiFetch<any>("/api/meetings/instant", {
    method: "POST",
    body: JSON.stringify({
      host_name: hostName,
      host_video: hostVideo,
      participant_video: participantVideo,
      meeting_id: meetingId || null,
      meeting_type: meetingType || "instant",
      passcode: passcode || null,
      waiting_room_enabled: waitingRoomEnabled !== undefined ? waitingRoomEnabled : false,
    }),
    signal,
  });
  return mapMeeting(res);
}

export async function scheduleMeeting(
  data: ScheduleMeetingInput,
  signal?: AbortSignal
): Promise<Meeting> {
  // Map frontend ScheduleMeetingInput → backend MeetingCreate schema
  const body = {
    title: data.topic || "My Meeting",
    description: data.description || "",
    host_name: data.hostName || "John Doe",
    start_time: new Date(`${data.date}T${data.time}`).toISOString(),
    duration_minutes: Number(data.durationHours) * 60 + Number(data.durationMinutes),
    passcode: data.passcodeEnabled ? data.passcode : null,
    waiting_room_enabled: data.waitingRoom,
    host_video: data.hostVideo === "on",
    participant_video: data.participantVideo === "on",
    meeting_type: "scheduled",
    is_recurring: false,
  };

  const res = await apiFetch<any>("/api/meetings/schedule", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  return mapMeeting(res);
}

export async function updateMeeting(
  uuid: string,
  data: Partial<Meeting>,
  signal?: AbortSignal
): Promise<Meeting> {
  // Map camelCase modifications → snake_case updates
  const body: any = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.startTime !== undefined) body.start_time = data.startTime;
  if (data.durationMinutes !== undefined) body.duration_minutes = data.durationMinutes;
  if (data.passcode !== undefined) body.passcode = data.passcode;
  if (data.waitingRoomEnabled !== undefined) body.waiting_room_enabled = data.waitingRoomEnabled;
  if (data.hostVideo !== undefined) body.host_video = data.hostVideo;
  if (data.participantVideo !== undefined) body.participant_video = data.participantVideo;

  const res = await apiFetch<any>(`/api/meetings/${uuid}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    signal,
  });
  return mapMeeting(res);
}

export async function deleteMeeting(uuid: string, signal?: AbortSignal): Promise<void> {
  await apiFetch<any>(`/api/meetings/${uuid}`, {
    method: "DELETE",
    signal,
  });
}

export async function endMeeting(uuid: string, signal?: AbortSignal): Promise<Meeting> {
  const res = await apiFetch<any>(`/api/meetings/${uuid}/end`, {
    method: "POST",
    signal,
  });
  return mapMeeting(res);
}

export async function validateMeeting(
  meetingId: string,
  signal?: AbortSignal
): Promise<{ valid: boolean; meeting?: Meeting }> {
  const cleanId = meetingId.replace(/-/g, "").trim();
  const res = await apiFetch<{ valid: boolean; meeting?: any; message: string }>(
    `/api/meetings/${cleanId}/validate`,
    { method: "GET", signal }
  );

  return {
    valid: res.valid,
    meeting: res.meeting ? mapMeeting(res.meeting) : undefined,
  };
}

/* ==========================================================================
   PARTICIPANTS ENDPOINTS
   ========================================================================== */

export async function getParticipants(
  uuid: string,
  signal?: AbortSignal
): Promise<Participant[]> {
  const res = await apiFetch<any[]>(`/api/meetings/${uuid}/participants`, {
    method: "GET",
    signal,
  });
  return res.map(mapParticipant);
}

export async function addParticipant(
  uuid: string,
  data: { name: string; email?: string; role?: string; video_on?: boolean },
  signal?: AbortSignal
): Promise<Participant> {
  const body = {
    name: data.name,
    email: data.email || null,
    role: data.role || "participant",
    video_on: data.video_on !== undefined ? data.video_on : true,
  };

  const res = await apiFetch<any>(`/api/meetings/${uuid}/participants`, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  return mapParticipant(res);
}

export async function removeParticipant(
  uuid: string,
  participantId: number,
  signal?: AbortSignal
): Promise<void> {
  await apiFetch<any>(`/api/meetings/${uuid}/participants/${participantId}`, {
    method: "DELETE",
    signal,
  });
}

export async function admitParticipant(
  uuid: string,
  participantId: number,
  signal?: AbortSignal
): Promise<Participant> {
  const res = await apiFetch<any>(`/api/meetings/${uuid}/participants/${participantId}/admit`, {
    method: "POST",
    signal,
  });
  return mapParticipant(res);
}

export async function toggleParticipantMute(
  uuid: string,
  participantId: number,
  isMuted: boolean,
  signal?: AbortSignal
): Promise<Participant> {
  const res = await apiFetch<any>(
    `/api/meetings/${uuid}/participants/${participantId}/mute`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_muted: isMuted }),
      signal,
    }
  );
  return mapParticipant(res);
}

export async function muteAllParticipants(
  uuid: string,
  signal?: AbortSignal
): Promise<{ message: string; count: number }> {
  return await apiFetch<{ message: string; count: number }>(
    `/api/meetings/${uuid}/participants/mute-all`,
    {
      method: "PATCH",
      signal,
    }
  );
}

export async function getChatMessages(
  uuid: string,
  signal?: AbortSignal
): Promise<Array<{ id: number; sender: string; text: string; createdAt: string }>> {
  const res = await apiFetch<any[]>(`/api/meetings/${uuid}/messages`, {
    method: "GET",
    signal,
  });
  return res.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    createdAt: m.created_at,
  }));
}

export async function sendChatMessage(
  uuid: string,
  sender: string,
  text: string,
  signal?: AbortSignal
): Promise<{ id: number; sender: string; text: string; createdAt: string }> {
  const res = await apiFetch<any>(`/api/meetings/${uuid}/messages`, {
    method: "POST",
    body: JSON.stringify({ sender, text }),
    signal,
  });
  return {
    id: res.id,
    sender: res.sender,
    text: res.text,
    createdAt: res.created_at,
  };
}

export async function renameParticipant(
  uuid: string,
  participantId: number,
  name: string,
  signal?: AbortSignal
): Promise<Participant> {
  const res = await apiFetch<any>(
    `/api/meetings/${uuid}/participants/${participantId}/rename`,
    {
      method: "PATCH",
      body: JSON.stringify({ name }),
      signal,
    }
  );
  return mapParticipant(res);
}
