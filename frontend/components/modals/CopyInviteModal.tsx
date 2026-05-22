"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingTitle: string;
  meetingTime: string;
  meetingId: string;
  passcode: string;
  meetingLink: string;
}

export function CopyInviteModal({
  isOpen,
  onClose,
  meetingTitle,
  meetingTime,
  meetingId,
  passcode,
  meetingLink,
}: CopyInviteModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const invitationText = `John Doe is inviting you to a scheduled Zoom meeting.\n\nTopic: ${meetingTitle}\nTime: ${meetingTime}\n\nJoin Zoom Meeting:\n${meetingLink}\n\nMeeting ID: ${meetingId}\nPasscode: ${passcode || "None"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationText);
    setCopied(true);
    toast.success("Invitation details copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[#E5E5E5] m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-lg font-bold text-[#1F1F1F] mb-3">Copy Meeting Invitation</h3>
        
        {/* Invitation preview textarea */}
        <textarea
          readOnly
          value={invitationText}
          className="w-full h-48 rounded-lg border border-[#E5E5E5] bg-[#F8F8F8] p-3.5 font-mono text-xs text-[#747487] resize-none outline-none focus:border-[#0B5CFF] leading-relaxed"
        />

        {/* Action button rows */}
        <div className="mt-5 flex justify-end gap-3 border-t border-[#F3F3F3] pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E5E5E5] bg-white px-4.5 py-2 text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
          >
            Close
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B5CFF] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#0E72ED] transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied! ✓" : "Copy Invitation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
