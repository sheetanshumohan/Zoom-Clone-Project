import { NextResponse } from "next/server";

export async function GET() {
  const previousMeetings = [
    {
      id: "m-p1",
      meetingId: "554-998-102",
      topic: "Daily Standup - Team Alpha",
      startTime: new Date(Date.now() - 60 * 60 * 1000 * 5).toISOString(),
      duration: 15,
      status: "previous",
    },
    {
      id: "m-p2",
      meetingId: "612-404-981",
      topic: "Client Onboarding: Acme Corp",
      startTime: new Date(Date.now() - 60 * 60 * 1000 * 30).toISOString(),
      duration: 50,
      status: "previous",
    },
    {
      id: "m-p3",
      meetingId: "777-221-550",
      topic: "Technical Architecture Discussion",
      startTime: new Date(Date.now() - 60 * 60 * 1000 * 96).toISOString(),
      duration: 90,
      status: "previous",
    },
  ];

  return NextResponse.json(previousMeetings);
}
