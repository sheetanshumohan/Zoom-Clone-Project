"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, Copy, Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createInstantMeeting } from "@/lib/api";
import { formatMeetingId, getOrCreatePersonalPmi, getOrCreatePersonalPasscode } from "@/lib/utils";

export default function NewMeetingPage() {
  const router = useRouter();
  
  // State variables
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [usePMI, setUsePMI] = useState(false);
  const [personalPmi, setPersonalPmi] = useState("1234567890");
  const [personalPasscode, setPersonalPasscode] = useState("ZOOM2026");
  const [meetingId, setMeetingId] = useState("Generating...");
  const [inviteLink, setInviteLink] = useState("Generating...");
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load PMI from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const pmi = getOrCreatePersonalPmi();
    const passcode = getOrCreatePersonalPasscode();
    setPersonalPmi(pmi);
    setPersonalPasscode(passcode);
  }, []);

  // Generate a preview layout local mockup ID
  useEffect(() => {
    if (!mounted) return;
    if (usePMI) {
      const cleanPmi = personalPmi.replace(/\D/g, "");
      setMeetingId(cleanPmi);
      setInviteLink(`${window.location.origin}/meeting/join?meetingId=${cleanPmi}`);
    } else {
      const mockId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      setMeetingId(mockId);
      setInviteLink(`${window.location.origin}/meeting/join?meetingId=${mockId}`);
    }
  }, [usePMI, personalPmi, mounted]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartMeeting = async () => {
    setStarting(true);
    let hostName = "John Doe";
    try {
      const stored = localStorage.getItem("zoom_clone_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) {
          hostName = parsed.displayName;
        }
      }
    } catch (err) {
      console.warn("Failed to load host profile:", err);
    }

    try {
      const cleanPmi = personalPmi.replace(/\D/g, "");
      const meeting = await createInstantMeeting(
        hostName,
        isVideoOn,
        true,
        meetingId,
        usePMI ? "personal" : "instant",
        usePMI ? personalPasscode : undefined,
        usePMI ? true : false
      );
      toast.success("Meeting started successfully!");
      try {
        localStorage.setItem(`meeting_host_${meeting.meetingUuid}`, "true");
      } catch (_) {}
      router.push(`/meeting/room/${meeting.meetingUuid}?name=${encodeURIComponent(hostName)}`);
    } catch (err: any) {
      console.error("Failed to start instant meeting:", err);
      toast.error(err.message || "Failed to initialize meeting on the backend.");
      setStarting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center py-6">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        {/* Back Link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-[#747487] hover:text-[#1F1F1F] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* Title Block */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
            Start an Instant Meeting
          </h2>
          <p className="mt-1 text-sm text-[#747487]">
            Your personal meeting room is ready. Configure options below.
          </p>
        </div>

        {/* Options Toggles */}
        <div className="mt-6 space-y-4 border-t border-b border-[#E5E5E5] py-4">
          {/* Video Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[#1F1F1F]">Video On</span>
              <p className="text-xs text-[#747487]">Start the meeting with your webcam active</p>
            </div>
            {/* Custom Toggle Switch */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isVideoOn}
                onChange={(e) => setIsVideoOn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* PMI Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-[#1F1F1F]">Use Personal Meeting ID (PMI)</span>
              <p className="text-xs text-[#747487]">Lock meeting to your constant ID: {personalPmi.slice(0, 3)}-{personalPmi.slice(3, 6)}-{personalPmi.slice(6)}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={usePMI}
                onChange={(e) => setUsePMI(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-xl bg-[#EBF2FF] p-4 text-[#1B3B6F]">
          <div className="flex items-center gap-2.5">
            <Video className="h-5 w-5 text-[#0B5CFF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#747487]">Meeting Room Details</span>
          </div>
          
          <div className="mt-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-[#1F1F1F]">Meeting ID:</span>
              <span className="font-mono font-bold text-[#0B5CFF]">{formatMeetingId(meetingId)}</span>
            </div>
            
            <div className="relative group flex items-center gap-1.5 text-xs text-[#747487]">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-[#0B5CFF]" />
              <span className="truncate max-w-[280px]" title={inviteLink}>
                {inviteLink}
              </span>
              
              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded bg-[#1F1F1F] p-2 text-white text-[10px] group-hover:block whitespace-nowrap shadow-md">
                {inviteLink}
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-[#0B5CFF] bg-white px-3 py-1.5 text-xs font-bold text-[#0B5CFF] transition-all hover:bg-[#EBF2FF]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#22C55E]" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Invite Link
          </button>
        </div>

        {/* Actions Row */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleStartMeeting}
            disabled={starting}
            className="flex w-full h-[48px] items-center justify-center gap-2 rounded-lg bg-[#0B5CFF] font-bold text-white shadow-sm transition-all hover:bg-[#0E72ED] disabled:bg-[#0B5CFF]/70 disabled:cursor-not-allowed"
          >
            {starting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Starting Meeting...</span>
              </>
            ) : (
              <span>Start Meeting</span>
            )}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            disabled={starting}
            className="flex w-full h-[40px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-white font-semibold text-[#1F1F1F] transition-all hover:bg-[#F3F3F3] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
