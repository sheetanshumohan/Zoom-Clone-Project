import { NextResponse } from "next/server";

export async function GET() {
  const upcomingMeetings = [
    {
      id: "m-u1",
      meetingId: "348-902-118",
      topic: "Weekly Sync - AI Platform",
      startTime: new Date(Date.now() + 60 * 60 * 1000 * 1.5).toISOString(),
      duration: 45,
      status: "upcoming",
    },
    {
      id: "m-u2",
      meetingId: "992-801-447",
      topic: "Design Review: Zoom UI Clone",
      startTime: new Date(Date.now() + 60 * 60 * 1000 * 20).toISOString(),
      duration: 30,
      status: "upcoming",
    },
    {
      id: "m-u3",
      meetingId: "123-456-789",
      topic: "Sprint Planning & Estimation",
      startTime: new Date(Date.now() + 60 * 60 * 1000 * 50).toISOString(),
      duration: 60,
      status: "upcoming",
    },
  ];

  return NextResponse.json(upcomingMeetings);
}
