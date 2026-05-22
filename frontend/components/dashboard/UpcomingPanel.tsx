"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Copy, Check, Trash2, Edit3, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";


import { getUpcomingMeetings, getPreviousMeetings, deleteMeeting } from "@/lib/api";
import { formatMeetingDateTime, parseApiDateTime } from "@/lib/utils";
import { Meeting } from "@/lib/types";

interface UpcomingPanelProps {
  onDeleteMeeting?: (uuid: string) => void;
  onEditMeeting?: (meeting: Meeting) => void;
}

export default function UpcomingPanel({ onDeleteMeeting, onEditMeeting }: UpcomingPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "previous">("upcoming");
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load meetings from API
  useEffect(() => {
    let active = true;
    async function loadMeetings() {
      setLoading(true);
      try {
        let data: Meeting[] = [];
        if (activeTab === "upcoming") {
          data = await getUpcomingMeetings();
        } else {
          data = await getPreviousMeetings();
        }
        
        if (active) {
          // Sort chronologically (upcoming: ascending, previous: descending)
          data.sort((a, b) => {
            const diff = parseApiDateTime(a.startTime).getTime() - parseApiDateTime(b.startTime).getTime();
            return activeTab === "upcoming" ? diff : -diff;
          });
          setMeetings(data);
        }
      } catch (err: any) {
        console.error(`Failed to fetch ${activeTab} meetings:`, err);
        if (active) {
          toast.error(`Failed to load ${activeTab} meetings from server.`);
          setMeetings([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeetings();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const handleCopyId = (meetingId: string) => {
    navigator.clipboard.writeText(meetingId.replace(/-/g, ""));
    setCopiedId(meetingId);
    toast.success(`Meeting ID ${meetingId} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartMeeting = (meetingUuid: string) => {
    toast.success("Starting meeting room...");
    try {
      localStorage.setItem(`meeting_host_${meetingUuid}`, "true");
    } catch (_) {}
    router.push(`/meeting/room/${meetingUuid}`);
  };

  const handleDelete = async (uuid: string, title: string) => {
    try {
      if (onDeleteMeeting) {
        onDeleteMeeting(uuid);
      } else {
        await deleteMeeting(uuid);
        setMeetings((prev) => prev.filter((m) => m.meetingUuid !== uuid));
        toast.success(`Deleted meeting "${title}"`);
      }
    } catch (err: any) {
      console.error("Failed to delete meeting:", err);
      toast.error("Could not delete meeting from server.");
    }
  };

  const handleEdit = (meeting: Meeting) => {
    if (onEditMeeting) {
      onEditMeeting(meeting);
    } else {
      toast.info(`Redirecting to edit meeting "${meeting.title}"`);
      router.push(`/meeting/schedule?edit=${meeting.meetingUuid}`);
    }
  };

  return (
    <div className="w-full rounded-xl bg-white p-5 border border-[#E5E5E5]/50 shadow-sm">
      <h3 className="text-lg font-bold text-[#1F1F1F]">Meetings</h3>

      {/* Tabs Layout */}
      <div className="mt-3 flex border-b border-[#E5E5E5]">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 pb-2 text-center text-sm font-semibold transition-all border-b-2 ${
            activeTab === "upcoming"
              ? "border-[#0B5CFF] text-[#0B5CFF]"
              : "border-transparent text-[#747487] hover:text-[#1F1F1F]"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setActiveTab("previous")}
          className={`flex-1 pb-2 text-center text-sm font-semibold transition-all border-b-2 ${
            activeTab === "previous"
              ? "border-[#0B5CFF] text-[#0B5CFF]"
              : "border-transparent text-[#747487] hover:text-[#1F1F1F]"
          }`}
        >
          Previous
        </button>
      </div>

      {/* Meetings Card List */}
      <div className="mt-4 space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] p-4 space-y-3"
            >
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
              <div className="flex gap-2 pt-2">
                <div className="h-7 w-16 rounded bg-gray-200" />
                <div className="h-7 w-12 rounded bg-gray-200" />
              </div>
            </div>
          ))
        ) : meetings.length === 0 ? (
          // Empty State Layout
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F3F3] text-[#747487]">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#1F1F1F]">
              No {activeTab} meetings
            </p>
            <p className="text-xs text-[#747487] mt-1 max-w-[200px]">
              You can create or schedule a new meeting from the home panel.
            </p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="group relative rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm transition-all hover:border-[#0B5CFF] hover:shadow-md"
            >
              {/* Meeting Title */}
              <h4 className="text-sm font-bold text-[#1F1F1F] line-clamp-1">
                {meeting.title}
              </h4>

              {/* Date & Time */}
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#747487]">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatMeetingDateTime(meeting.startTime)}</span>
                <span className="text-gray-300">•</span>
                <span>{meeting.durationMinutes} min</span>
              </div>

              {/* Meeting ID */}
              <div className="mt-1.5 flex items-center justify-between gap-1.5 rounded bg-[#F8F8F8] px-2 py-1 text-xs text-[#747487]">
                <div className="flex items-center gap-1">
                  <span className="font-mono">ID: {meeting.meetingId}</span>
                </div>
                <button
                  onClick={() => handleCopyId(meeting.meetingId)}
                  className="text-[#747487] hover:text-[#0B5CFF] transition-colors"
                  title="Copy Meeting ID"
                >
                  {copiedId === meeting.meetingId ? (
                    <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Row of Action Buttons */}
              <div className="mt-3.5 flex items-center justify-between border-t border-[#F3F3F3] pt-3">
                <div className="flex gap-2">
                  {meeting.status === "upcoming" || meeting.status === "scheduled" ? (
                    <button
                      onClick={() => handleStartMeeting(meeting.meetingUuid)}
                      className="rounded-md bg-[#0B5CFF] px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-[#0E72ED]"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartMeeting(meeting.meetingUuid)}
                      className="rounded-md border border-[#0B5CFF] px-3.5 py-1.5 text-xs font-bold text-[#0B5CFF] hover:bg-[#0B5CFF] hover:text-white transition-all"
                    >
                      Rejoin
                    </button>
                  )}
                  {(meeting.status === "upcoming" || meeting.status === "scheduled") && (
                    <button
                      onClick={() => handleEdit(meeting)}
                      className="rounded-md px-2 py-1.5 text-xs font-semibold text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(meeting.meetingUuid, meeting.title)}
                  className="rounded-md p-1.5 text-[#747487] hover:bg-[#FDF2F2] hover:text-[#E34040] transition-all"
                  title="Delete Meeting"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
