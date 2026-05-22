"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, Video, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import ActionBar from "@/components/dashboard/ActionBar";
import UpcomingPanel from "@/components/dashboard/UpcomingPanel";
import { getRecentMeetings } from "@/lib/api";
import { Meeting } from "@/lib/types";
import { formatMeetingId, formatMeetingDateTime, parseApiDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("You");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoom_clone_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) setProfileName(parsed.displayName);
      }
    } catch (_) { }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      setLoading(true);
      try {
        const data = await getRecentMeetings();
        if (active) {
          // Sort by start_time descending (latest first) to guarantee UI order
          const sorted = [...data].sort((a, b) => {
            const timeA = parseApiDateTime(a.startTime).getTime();
            const timeB = parseApiDateTime(b.startTime).getTime();
            return timeB - timeA;
          });
          setRecentMeetings(sorted);
        }
      } catch (err: any) {
        console.error("Failed to fetch recent meetings:", err);
        toast.error("Failed to load recent meetings from server.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecent();
    return () => {
      active = false;
    };
  }, []);

  const handleCopyId = (rawId: string) => {
    const cleanId = rawId.replace(/-/g, "");
    navigator.clipboard.writeText(cleanId);
    setCopiedId(rawId);
    toast.success(`Meeting ID ${formatMeetingId(rawId)} copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartMeeting = (meetingUuid: string) => {
    toast.success("Starting meeting room...");
    try {
      localStorage.setItem(`meeting_host_${meetingUuid}`, "true");
    } catch (_) {}
    router.push(`/meeting/room/${meetingUuid}?name=${encodeURIComponent(profileName)}`);
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Column: Action Tiles and Recent Table */}
      <div className="flex-1 space-y-8">
        {/* Quick Action Tiles & Digital Clock */}
        <ActionBar />

        {/* Recent Meetings Table */}
        <div className="rounded-xl border border-[#E5E5E5]/50 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3.5">
            <h3 className="text-lg font-bold text-[#1F1F1F]">Recent Meetings</h3>
            <Link
              href="/meetings"
              className="flex items-center gap-1 text-sm font-semibold text-[#0B5CFF] hover:text-[#0E72ED] hover:underline transition-all"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487]">Topic</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487]">Meeting ID</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487]">Date</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487]">Duration</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487] text-center">Participants</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#747487] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Pulse Table Skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-[#E5E5E5] animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-32 rounded bg-gray-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-12 rounded bg-gray-200" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 w-8 rounded bg-gray-200 mx-auto" /></td>
                      <td className="px-4 py-4 text-right"><div className="h-7 w-20 rounded bg-gray-200 ml-auto" /></td>
                    </tr>
                  ))
                ) : recentMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#747487]">
                      No recent meetings found.
                    </td>
                  </tr>
                ) : (
                  recentMeetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      className="border-b border-[#E5E5E5] text-sm text-[#1F1F1F] transition-all hover:bg-[#F8F8F8]/60"
                    >
                      {/* Topic */}
                      <td className="px-4 py-3.5 font-semibold text-[#1F1F1F] max-w-[200px] truncate">
                        <Link href={`/meetings/${meeting.meetingUuid}`} className="hover:text-[#0B5CFF] hover:underline">
                          {meeting.title}
                        </Link>
                      </td>

                      {/* Meeting ID */}
                      <td className="px-4 py-3.5 font-mono text-xs text-[#747487]">
                        <div className="flex items-center gap-1.5">
                          <span>{formatMeetingId(meeting.meetingId)}</span>
                          <button
                            onClick={() => handleCopyId(meeting.meetingId)}
                            className="text-[#747487] hover:text-[#0B5CFF] transition-all"
                            title="Copy Meeting ID"
                          >
                            {copiedId === meeting.meetingId ? (
                              <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-[#747487]">
                        {formatMeetingDateTime(meeting.startTime)}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3.5 text-xs text-[#747487]">
                        {meeting.durationMinutes} min
                      </td>

                      {/* Participants */}
                      <td className="px-4 py-3.5 text-center text-xs font-semibold text-[#1F1F1F]">
                        {meeting.participantCount}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartMeeting(meeting.meetingUuid)}
                            className="inline-flex items-center gap-1 rounded bg-[#0B5CFF]/10 px-2.5 py-1.5 text-xs font-bold text-[#0B5CFF] hover:bg-[#0B5CFF] hover:text-white transition-all"
                          >
                            <Video className="h-3 w-3" />
                            <span>Start</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Upcoming Sidebar Panel */}
      <div className="w-full lg:w-[320px] shrink-0">
        <UpcomingPanel />
      </div>
    </div>
  );
}
