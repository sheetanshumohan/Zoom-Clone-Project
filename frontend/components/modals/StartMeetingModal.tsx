"use client";

import React, { useState, useEffect } from "react";
import { X, Video, VideoOff, Mic, MicOff, User } from "lucide-react";

interface StartMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { joinVideo: boolean; joinAudio: boolean }) => void;
}

export function StartMeetingModal({
  isOpen,
  onClose,
  onConfirm,
}: StartMeetingModalProps) {
  const [joinVideo, setJoinVideo] = useState(true);
  const [joinAudio, setJoinAudio] = useState(true);

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

  const handleStart = () => {
    onConfirm({ joinVideo, joinAudio });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-[#E5E5E5] m-4 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#747487] hover:bg-[#F3F3F3] hover:text-[#1F1F1F] transition-all"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="text-lg font-bold text-[#1F1F1F] self-start mb-4">Start meeting with video?</h3>

        {/* Camera Preview placeholder */}
        <div className="relative h-[180px] w-full max-w-[320px] overflow-hidden rounded-xl bg-gradient-to-br from-[#2D2D2D] to-[#1F1F1F] border border-[#3E3E3E] flex items-center justify-center mb-5">
          {joinVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center mb-2">
                <User className="h-7 w-7 text-white/50" />
              </div>
              <span className="text-[10px] bg-black/60 rounded px-2.5 py-0.5 text-white/70 font-semibold border border-white/5">
                Camera Feed Active
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-[#747487]">
              <VideoOff className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-xs font-semibold">Camera is Turned Off</span>
            </div>
          )}
        </div>

        {/* Device Switches */}
        <div className="w-full space-y-3.5 border-t border-[#F3F3F3] pt-4.5 mb-5 text-left text-sm">
          
          {/* Join with Video Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {joinVideo ? <Video className="h-4.5 w-4.5 text-[#0B5CFF]" /> : <VideoOff className="h-4.5 w-4.5 text-[#747487]" />}
              <span className="font-semibold text-[#1F1F1F]">Join with video</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={joinVideo}
                onChange={(e) => setJoinVideo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Join with Audio Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {joinAudio ? <Mic className="h-4.5 w-4.5 text-[#0B5CFF]" /> : <MicOff className="h-4.5 w-4.5 text-[#747487]" />}
              <span className="font-semibold text-[#1F1F1F]">Join with audio</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={joinAudio}
                onChange={(e) => setJoinAudio(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-6 w-11 rounded-full bg-[#E5E5E5] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-[#0B5CFF] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 w-full">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#E5E5E5] bg-white h-[44px] text-xs font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
          >
            Cancel
          </button>
          
          <button
            onClick={handleStart}
            className="flex-1 rounded-lg bg-[#0B5CFF] h-[44px] text-xs font-bold text-white hover:bg-[#0E72ED] transition-all"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
