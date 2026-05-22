"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Video, HelpCircle, Check, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { validateMeeting } from "@/lib/api";

function JoinMeetingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State variables
  const [meetingId, setMeetingId] = useState("");
  const [name, setName] = useState("John Doe");
  const [noAudio, setNoAudio] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validating, setValidating] = useState(false);

  // Check if screen sharing or meeting ID was requested in query params
  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (shareParam === "true") {
      setNoVideo(true);
      toast.info("Joining in Screen Share mode (Video off)");
    }

    const idParam = searchParams.get("meetingId") || searchParams.get("id");
    if (idParam) {
      const cleaned = idParam.replace(/[^a-zA-Z0-9]/g, "");
      if (!/[a-zA-Z]/.test(cleaned)) {
        let formatted = cleaned;
        if (cleaned.length <= 3) {
          formatted = cleaned;
        } else if (cleaned.length <= 6) {
          formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        } else if (cleaned.length <= 10) {
          formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else {
          formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        setMeetingId(formatted);
      } else {
        setMeetingId(idParam);
      }
    }
  }, [searchParams]);

  // Load display name from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoom_clone_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.displayName) {
          setName(parsed.displayName);
        }
      }
    } catch (err) {
      console.error("Failed to load profile in JoinMeetingPage:", err);
    }
  }, []);

  // Format meeting ID dynamically
  const handleMeetingIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setErrorMsg("");
    
    // Strip non-alphanumeric values
    const cleaned = rawVal.replace(/[^a-zA-Z0-9]/g, "");
    const hasLetters = /[a-zA-Z]/.test(cleaned);
    
    if (hasLetters || cleaned.length === 0) {
      setMeetingId(rawVal);
      return;
    }

    // Format numbers with dashes
    let formatted = "";
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length <= 10) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    
    setMeetingId(formatted);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedId = meetingId.replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanedId) {
      setErrorMsg("Please enter a meeting ID or personal link name.");
      return;
    }

    if (cleanedId.length < 5) {
      setErrorMsg("Meeting ID or personal link is too short.");
      return;
    }

    setValidating(true);
    setErrorMsg("");

    try {
      // Validate meeting via backend API client
      const result = await validateMeeting(cleanedId);
      
      if (result.valid && result.meeting) {
        toast.success("Meeting validated! Connecting...");
        const isShareMode = searchParams.get("share") === "true";
        router.push(
          `/meeting/room/${result.meeting.meetingUuid}?name=${encodeURIComponent(name)}&audio=${!noAudio}&video=${!noVideo}${isShareMode ? "&share=true" : ""}`
        );
      } else {
        setErrorMsg("Meeting not found or has ended");
        toast.error("Invalid meeting identifier.");
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      setErrorMsg(err.message || "Failed to validate meeting.");
      toast.error("Failed to connect to backend server.");
    } finally {
      setValidating(false);
    }
  };

  const handlePasteInviteLink = () => {
    const url = prompt("Paste full Zoom invite link here:");
    if (!url) return;

    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      const roomIndex = pathSegments.indexOf("room");
      
      let extractedId = "";
      if (roomIndex !== -1 && pathSegments[roomIndex + 1]) {
        extractedId = pathSegments[roomIndex + 1];
      } else {
        extractedId = urlObj.searchParams.get("id") || urlObj.searchParams.get("meetingId") || "";
      }

      if (extractedId) {
        const cleaned = extractedId.replace(/[^a-zA-Z0-9]/g, "");
        let formatted = cleaned;
        if (!/[a-zA-Z]/.test(cleaned)) {
          if (cleaned.length <= 10) {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
          } else {
            formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
          }
        }
        setMeetingId(formatted);
        toast.success("Successfully extracted meeting ID from invite link!");
      } else {
        toast.error("Could not find a valid meeting ID in that URL.");
      }
    } catch (e) {
      toast.error("Invalid URL format. Please paste a valid web link.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] w-full overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
      {/* Left Panel: Form */}
      <div className="flex w-full flex-col justify-between p-6 md:p-10 lg:w-1/2">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs font-semibold text-[#747487] hover:text-[#1F1F1F] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#0B5CFF]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z" fill="white" />
                <path d="M17 9.5L20.5 7.16667C21.0523 6.79848 21.8 7.1942 21.8 7.86016V16.1398C21.8 16.8058 21.0523 17.2015 20.5 16.8333L17 14.5V9.5Z" fill="white" />
              </svg>
            </div>
            <span className="text-xs font-extrabold tracking-tight text-[#0B5CFF]">zoom</span>
          </div>
        </div>

        {/* Center Contents Form */}
        <div className="my-auto py-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1F1F1F]">
            Join a Meeting
          </h2>
          <p className="mt-1.5 text-sm text-[#747487]">
            Enter a Meeting ID or Personal Link Name to get started.
          </p>

          <form onSubmit={handleJoin} className="mt-8 space-y-5">
            {/* Input 1: Meeting ID */}
            <div className="space-y-1">
              <label htmlFor="meeting-id" className="text-xs font-bold uppercase tracking-wider text-[#747487]">
                Meeting ID or Personal Link Name
              </label>
              <input
                id="meeting-id"
                type="text"
                value={meetingId}
                onChange={handleMeetingIdChange}
                placeholder="Enter Meeting ID or personal link name"
                suppressHydrationWarning={true}
                className={`flex h-[56px] w-full rounded-lg border px-4 text-base font-semibold outline-none transition-all ${
                  errorMsg
                    ? "border-[#E34040] focus:border-[#E34040] focus:ring-1 focus:ring-[#E34040]"
                    : "border-[#E5E5E5] focus:border-[#0B5CFF]"
                }`}
              />
              {errorMsg && (
                <p className="text-xs font-medium text-[#E34040]">{errorMsg}</p>
              )}
            </div>

            {/* Input 2: Display Name */}
            <div className="space-y-1">
              <label htmlFor="display-name" className="text-xs font-bold uppercase tracking-wider text-[#747487]">
                Your Name
              </label>
              <input
                id="display-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                suppressHydrationWarning={true}
                className="flex h-[56px] w-full rounded-lg border border-[#E5E5E5] px-4 text-base font-semibold outline-none focus:border-[#0B5CFF]"
              />
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={noAudio}
                  onChange={(e) => setNoAudio(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F] group-hover:text-black">
                  Do not connect to audio
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={noVideo}
                  onChange={(e) => setNoVideo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E5E5] bg-white transition-all peer-checked:border-[#0B5CFF] peer-checked:bg-[#0B5CFF]">
                  <Check className="h-3.5 w-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
                </div>
                <span className="text-sm font-medium text-[#1F1F1F] group-hover:text-black">
                  Turn off my video
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={validating}
              suppressHydrationWarning={true}
              className="flex w-full h-[52px] items-center justify-center gap-2 rounded-lg bg-[#0B5CFF] font-bold text-white shadow-sm transition-all hover:bg-[#0E72ED] disabled:bg-[#0B5CFF]/70 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying Meeting...</span>
                </>
              ) : (
                <span>Join Meeting</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Option */}
        <div className="border-t border-[#E5E5E5] pt-4 text-center">
          <button
            onClick={handlePasteInviteLink}
            suppressHydrationWarning={true}
            className="text-sm font-bold text-[#0B5CFF] hover:text-[#0E72ED] hover:underline transition-all"
          >
            Or, Join using invite link
          </button>
        </div>
      </div>

      {/* Right Panel: Gradient Illustration */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#0B5CFF] to-[#0052CC] p-10 text-white lg:flex">
        {/* Help icon */}
        <div className="flex justify-end">
          <button
            onClick={() => toast.info("Enter meeting IDs as digits or standard personal text handles.")}
            suppressHydrationWarning={true}
            className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white"
          >
            <HelpCircle className="h-4 w-4" />
            Need help?
          </button>
        </div>

        {/* Centered Graphic Vector Simulation */}
        <div className="my-auto flex flex-col items-center">
          <div className="grid grid-cols-2 gap-4 w-[240px] h-[160px] bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-center rounded-lg bg-white/10 relative overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#FF6B35]"></div>
              <div className="absolute bottom-1 right-1 bg-black/40 rounded px-1 text-[8px]">JD</div>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-[#0B5CFF] relative overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/40"></div>
              <div className="absolute bottom-1 right-1 bg-black/40 rounded px-1 text-[8px]">Host</div>
            </div>
            <div className="flex items-center justify-center rounded-lg bg-white/10 relative overflow-hidden col-span-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
                <div className="w-4 h-4 rounded-full bg-purple-400"></div>
              </div>
            </div>
          </div>

          <h3 className="mt-8 text-center text-2xl font-bold">
            Connect with anyone, anywhere
          </h3>
          
          <ul className="mt-6 space-y-2.5 text-sm font-semibold text-white/90">
            <li className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#0B5CFF]">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>HD Video & Audio</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#0B5CFF]">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>Screen Sharing</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#0B5CFF]">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>Meeting Recording</span>
            </li>
          </ul>
        </div>

        <div className="text-center text-xs text-white/50">
          Powered by Zoom Meeting Client Clone v1.0
        </div>
      </div>
    </div>
  );
}

export default function JoinMeetingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0B5CFF] border-t-transparent" />
      </div>
    }>
      <JoinMeetingPageContent />
    </Suspense>
  );
}
