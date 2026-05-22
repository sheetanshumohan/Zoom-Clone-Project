import { NextResponse } from "next/server";

export async function GET() {
  const recentMeetings = [
    {
      id: "r1",
      meetingId: "847-192-094",
      topic: "Sync with Frontend Team",
      dateStr: "May 20, 2026, 02:00 PM",
      duration: "30 min",
      participantsCount: 4,
    },
    {
      id: "r2",
      meetingId: "552-998-102",
      topic: "FastAPI Architecture Refactor",
      dateStr: "May 19, 2026, 11:30 AM",
      duration: "60 min",
      participantsCount: 8,
    },
    {
      id: "r3",
      meetingId: "991-382-019",
      topic: "Weekly Client Check-in",
      dateStr: "May 18, 2026, 04:00 PM",
      duration: "45 min",
      participantsCount: 3,
    },
    {
      id: "r4",
      meetingId: "742-012-991",
      topic: "Zoom Layout UX Discussion",
      dateStr: "May 17, 2026, 09:00 AM",
      duration: "15 min",
      participantsCount: 5,
    },
    {
      id: "r5",
      meetingId: "402-991-884",
      topic: "1-on-1: Manager & John",
      dateStr: "May 16, 2026, 03:00 PM",
      duration: "30 min",
      participantsCount: 2,
    },
  ];
  
  return NextResponse.json(recentMeetings);
}
