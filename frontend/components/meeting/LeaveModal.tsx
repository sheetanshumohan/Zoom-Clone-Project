"use client";

import React from "react";
import { LogOut, Power, X } from "lucide-react";

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
  isHost: boolean;
}

export default function LeaveModal({ isOpen, onClose, onLeave, onEndForAll, isHost }: LeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card container */}
      <div className="relative w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-modal text-[#1F1F1F] animate-in zoom-in-95 duration-150">
        
        {/* Close Icon button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#1F1F1F] tracking-tight">
          Leave meeting?
        </h3>
        <p className="mt-1 text-sm text-[#747487]">
          Select how you would like to exit this conference.
        </p>

        {/* Actions grid */}
        <div className="mt-6 space-y-3.5">
          {/* Option 1: Leave Meeting */}
          <div
            onClick={onLeave}
            className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#E5E5E5] p-4 transition-all hover:bg-[#F8F8F8] hover:border-[#0B5CFF] group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F3F3] group-hover:bg-[#E8F0FE]">
              <LogOut className="h-5 w-5 text-[#747487] group-hover:text-[#0B5CFF]" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-[#1F1F1F]">Leave Meeting</span>
              <span className="block text-xs text-[#747487]">Keep the meeting running for others</span>
            </div>
          </div>

          {/* Option 2: End Meeting for All (Host only) */}
          {isHost && (
            <div
              onClick={onEndForAll}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#FDE8E8] bg-[#FDF2F2] p-4 transition-all hover:bg-[#FDE8E8] hover:border-[#E34040] group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDE8E8] group-hover:bg-[#FCD8D8]">
                <Power className="h-5 w-5 text-[#E34040]" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-[#E34040]">End Meeting for All</span>
                <span className="block text-xs text-[#E34040]/80">Terminate the room and eject participants</span>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Trigger */}
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="text-sm font-bold text-[#747487] hover:text-[#1F1F1F] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
