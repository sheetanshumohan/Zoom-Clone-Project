"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  User,
  Repeat,
  Share2,
  Trash2,
  Video,
  X,
  Shield,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getMeetingById, deleteMeeting, getParticipants } from "@/lib/api";
import { Meeting, Participant } from "@/lib/types";
import { formatMeetingId, formatMeetingDateTime, parseApiDateTime } from "@/lib/utils";

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const meetingUuidParam = params.meetingId as string;

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Custom states
  const [showPasscode, setShowPasscode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  
  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load meeting details
  useEffect(() => {
    let active = true;
    async function fetchDetails() {
      setLoading(true);
      try {
        const data = await getMeetingById(meetingUuidParam);
        let participantsData: Participant[] = [];
        try {
          participantsData = await getParticipants(meetingUuidParam);
        } catch (err) {
          console.warn("Failed to fetch meeting participants list:", err);
        }

        if (active) {
          setMeeting(data);
          setParticipants(participantsData);
        }
      } catch (err: any) {
        console.error("Failed to load meeting details:", err);
        toast.error("Failed to fetch meeting details from server.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (meetingUuidParam) {
      fetchDetails();
    }
    return () => {
      active = false;
    };
  }, [meetingUuidParam]);

  // Handle meeting deletion
  const handleDeleteConfirm = async () => {
    if (!meeting) return;
    try {
      await deleteMeeting(meeting.meetingUuid);
      toast.success("Meeting deleted successfully!");
      router.push("/meetings");
    } catch (err: any) {
      console.error("Failed to delete meeting:", err);
      toast.error(err.message || "Failed to delete meeting on server.");
    }
  };

  const handleCopyLink = () => {
    if (!meeting) return;
    navigator.clipboard.writeText(meeting.inviteLink);
    setCopiedLink(true);
    toast.success("Meeting link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = (mId: string) => {
    navigator.clipboard.writeText(mId.replace(/-/g, ""));
    toast.success("Meeting ID copied to clipboard!");
  };

  const handleStartMeeting = (uuid: string) => {
    toast.success("Starting meeting room...");
    try {
      localStorage.setItem(`meeting_host_${uuid}`, "true");
    } catch (_) {}
    router.push(`/meeting/room/${uuid}`);
  };

  const handleCopyPasscode = () => {
    if (!meeting || !meeting.passcode) return;
    navigator.clipboard.writeText(meeting.passcode);
    setCopiedPasscode(true);
    toast.success("Passcode copied!");
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const getInviteText = () => {
    if (!meeting) return "";
    return `John Doe is inviting you to a scheduled Zoom meeting.\n\nTopic: ${meeting.title}\nDate/Time: ${formatMeetingDateTime(meeting.startTime)}\n\nJoin Zoom Meeting:\n${meeting.inviteLink}\n\nMeeting ID: ${formatMeetingId(meeting.meetingId)}\nPasscode: ${meeting.passcode || "None"}`;
  };

  const handleCopyInvitationText = () => {
    navigator.clipboard.writeText(getInviteText());
    setCopiedInviteText(true);
    toast.success("Invitation details copied to clipboard!");
    setTimeout(() => setCopiedInviteText(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B5CFF] border-t-transparent" />
          <span className="text-xs text-[#747487] font-semibold">Loading Meeting Info...</span>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-center rounded-xl bg-white p-8 border border-[#E5E5E5] shadow-sm max-w-sm">
          <HelpCircle className="h-12 w-12 text-[#E34040] mx-auto" />
          <h3 className="mt-4 text-base font-bold text-[#1F1F1F]">Meeting Not Found</h3>
          <p className="text-xs text-[#747487] mt-1">This link might have expired or been deleted.</p>
          <Link href="/meetings" className="mt-5 inline-block text-xs font-bold text-[#0B5CFF] hover:underline">
            Go to Meetings List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
      <div className="w-full max-w-[720px] rounded-2xl border border-[#E5E5E5] bg-white p-8 shadow-md relative">
        
        {/* Header Back & Badge */}
        <div className="flex flex-col gap-3">
          <Link
            href="/meetings"
            className="flex items-center gap-1.5 text-xs font-bold text-[#747487] hover:text-[#1F1F1F]"
          >
            <ArrowLeft className="h-4 w-4" />
            My Meetings
          </Link>
          
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-bold text-[#1F1F1F] tracking-tight">{meeting.title}</h2>
            {meeting.status === "upcoming" || meeting.status === "scheduled" ? (
              <span className="rounded-full bg-[#E6F9F0] px-3 py-1 text-xs font-bold text-[#22C55E]">
                Upcoming
              </span>
            ) : meeting.status === "live" ? (
              <span className="rounded-full bg-[#FFECEB] px-3 py-1 text-xs font-bold text-[#FF3B30] animate-pulse">
                Live Now
              </span>
            ) : (
              <span className="rounded-full bg-[#F3F3F3] px-3 py-1 text-xs font-bold text-[#747487]">
                Ended
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#747487] font-semibold">
            <div className="h-5 w-5 rounded-full bg-[#EBF2FF] text-[#0B5CFF] flex items-center justify-center font-bold text-[9px]">
              JD
            </div>
            <span>Hosted by {meeting.hostName}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t border-[#F3F3F3] mt-6 pt-5 text-sm text-[#1F1F1F]">
          
          {/* Col 1 */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Date & Time</span>
              <span className="font-semibold text-[#1F1F1F]">{parseApiDateTime(meeting.startTime).toLocaleString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Duration</span>
              <span className="font-semibold text-[#1F1F1F]">
                {meeting.durationMinutes} minutes
              </span>
            </div>
          </div>

          {/* Col 3 */}
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Meeting ID</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#1F1F1F]">
                <span className="font-mono">{formatMeetingId(meeting.meetingId)}</span>
                <button onClick={() => handleCopyId(meeting.meetingId)} className="text-[#747487] hover:text-[#0B5CFF]">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Col 4 */}
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Security Passcode</span>
              <div className="flex items-center gap-2 font-semibold">
                <span className="font-mono">
                  {showPasscode ? meeting.passcode || "None" : "••••••"}
                </span>
                <button
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="text-[#747487] hover:text-[#0B5CFF]"
                >
                  {showPasscode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                {meeting.passcode && (
                  <button onClick={handleCopyPasscode} className="text-[#747487] hover:text-[#0B5CFF]">
                    {copiedPasscode ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Host User</span>
              <span className="font-semibold text-[#1F1F1F]">{meeting.hostName}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Repeat className="h-5 w-5 text-[#0B5CFF] shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-[#747487] uppercase tracking-wider">Recurring</span>
              <span className="font-semibold text-[#1F1F1F]">
                {meeting.isRecurring ? "Yes" : "No"}
              </span>
            </div>
          </div>

        </div>

        {/* Description Panel (if present) */}
        {meeting.description && (
          <div className="mt-6 rounded-xl bg-[#F8F8F8] p-4 text-xs text-[#747487] border border-[#E5E5E5]/40 leading-relaxed">
            <span className="block font-bold text-[#1F1F1F] mb-1">Meeting Description:</span>
            {meeting.description}
          </div>
        )}

        {/* Invite Link input panel */}
        <div className="mt-6 space-y-1.5 border-t border-[#F3F3F3] pt-5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#747487]">Invite Link</label>
          <div className="flex h-11 items-center rounded-lg bg-[#F3F3F3] border border-[#E5E5E5] px-3 overflow-hidden">
            <span className="flex-1 font-mono text-xs text-[#747487] truncate">
              {meeting.inviteLink}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs font-bold text-[#0B5CFF] hover:text-[#0E72ED] shrink-0 border-l border-[#E5E5E5] pl-3.5 ml-2"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0B5CFF] hover:underline pt-2.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Copy Invitation Details</span>
          </button>
        </div>

        {/* Mapped Participants list from Database */}
        <div className="mt-6 border-t border-[#F3F3F3] pt-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1F1F1F]">Participants ({participants.length})</h4>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs font-bold text-[#747487] hover:text-[#0B5CFF]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>+ Invite More</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-xs text-[#747487] italic">No active participants connected.</p>
            ) : (
              participants.map((p) => {
                const initials = p.name ? p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "P";
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#FAFAFA] p-2.5 border border-[#E5E5E5]/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: p.avatarColor || "#747487" }}>
                        {initials}
                      </div>
                      <span className="text-xs font-semibold text-[#1F1F1F]">{p.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      p.role === "host" ? "bg-[#0B5CFF]/10 text-[#0B5CFF]" : "bg-[#E5E5E5]/55 text-[#747487]"
                    }`}>
                      {p.role}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Button stack at bottom */}
        <div className="mt-8 border-t border-[#F3F3F3] pt-6 space-y-2.5">
          <button
            onClick={() => handleStartMeeting(meeting.meetingUuid)}
            className="flex w-full h-[52px] items-center justify-center gap-2 rounded-lg bg-[#0B5CFF] font-bold text-white shadow-sm transition-all hover:bg-[#0E72ED]"
          >
            <Video className="h-5 w-5" />
            <span>Start Meeting</span>
          </button>
          
          <button
            onClick={() => router.push(`/meeting/schedule?edit=${meeting.meetingUuid}`)}
            className="flex w-full h-[52px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-white font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
          >
            Edit Meeting
          </button>
          
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex w-full h-[52px] items-center justify-center rounded-lg bg-transparent font-bold text-[#E34040] hover:bg-red-50 transition-all"
          >
            Delete Meeting
          </button>
        </div>

      </div>

      {/* MODAL 1: Copy Invitation details popover */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[500px] rounded-2xl bg-white p-6 shadow-xl text-[#1F1F1F] animate-in zoom-in-95 duration-150 border border-[#E5E5E5]">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h3 className="text-base font-bold text-[#1F1F1F] mb-3">Copy Meeting Invitation</h3>
            
            <textarea
              readOnly
              value={getInviteText()}
              className="w-full h-64 rounded-lg border border-[#E5E5E5] bg-[#F8F8F8] p-3.5 font-mono text-xs text-[#747487] resize-none outline-none focus:border-[#0B5CFF]"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-[#747487] hover:bg-[#F3F3F3]"
              >
                Cancel
              </button>
              
              <button
                onClick={handleCopyInvitationText}
                className="flex items-center gap-1.5 rounded-lg bg-[#0B5CFF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E72ED]"
              >
                {copiedInviteText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>Copy Invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl text-[#1F1F1F] animate-in zoom-in-95 duration-150 border border-[#E5E5E5]">
            <h3 className="text-base font-bold text-[#1F1F1F]">Delete Scheduled Meeting</h3>
            <p className="text-xs text-[#747487] mt-1.5">
              Are you sure you want to permanently cancel and delete "{meeting.title}"? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-[#747487] hover:bg-[#F3F3F3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-[#E34040] px-4 py-2 text-xs font-bold text-white hover:bg-[#C93333]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
