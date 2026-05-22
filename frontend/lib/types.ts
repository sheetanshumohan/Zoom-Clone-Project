export interface Participant {
  id: number;
  name: string;
  email: string | null;
  role: "host" | "participant";
  isMuted: boolean;
  videoOn: boolean;
  joinedAt: string;
  avatarColor: string;
  approved: boolean;
}

export interface Meeting {
  id: number;
  meetingUuid: string;
  meetingId: string; // 10-digit raw string
  title: string;
  description: string | null;
  hostName: string;
  startTime: string; // ISO string
  durationMinutes: number;
  passcode: string | null;
  status: "upcoming" | "live" | "ended" | "scheduled";
  meetingType: "instant" | "scheduled" | "personal";
  isRecurring: boolean;
  waitingRoomEnabled: boolean;
  hostVideo: boolean;
  participantVideo: boolean;
  inviteLink: string;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  participants?: Participant[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  personalMeetingId: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

// Matching the frontend Scheduling Form structure for integration mapping
export interface ScheduleMeetingInput {
  topic: string;
  description?: string;
  date: string;
  time: string;
  timezone: string;
  durationHours: number;
  durationMinutes: number;
  meetingIdType: "auto" | "pmi";
  passcodeEnabled: boolean;
  passcode?: string;
  waitingRoom: boolean;
  hostVideo: "on" | "off";
  participantVideo: "on" | "off";
  hostName?: string; // Explicitly pass hostName to backend
}
