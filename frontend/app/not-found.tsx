"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Video, HelpCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-[#F3F3F3] px-6 text-[#1F1F1F] select-none">
      
      {/* Pulse Keyframe Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gentlePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(11, 92, 255, 0.4);
          }
          50% {
            transform: scale(1.05);
            opacity: 0.95;
            box-shadow: 0 0 20px 8px rgba(11, 92, 255, 0.2);
          }
        }
        .pulse-logo {
          animation: gentlePulse 2.5s infinite ease-in-out;
        }
      `}} />

      {/* Main card box container */}
      <div className="flex w-full max-w-[480px] flex-col items-center text-center">
        
        {/* Zoom Logo Brand */}
        <Link href="/dashboard" className="flex items-center gap-1.5 mb-10 hover:opacity-85 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0B5CFF]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z" fill="white" />
              <path d="M17 9.5L20.5 7.16667C21.0523 6.79848 21.8 7.1942 21.8 7.86016V16.1398C21.8 16.8058 21.0523 17.2015 20.5 16.8333L17 14.5V9.5Z" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tighter text-[#0B5CFF]">zoom</span>
        </Link>

        {/* Stacked 404 Watermark + Icon */}
        <div className="relative flex h-[160px] w-full items-center justify-center mb-6">
          <span className="text-[120px] font-black tracking-tight text-[#E5E5E5] leading-none select-none">
            404
          </span>
          <div className="pulse-logo absolute flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white shadow-md border border-[#E5E5E5]/40 text-[#0B5CFF]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8C4 6.89543 4.89543 6 6 6H14C15.1046 6 16 6.89543 16 8V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V8Z" fill="currentColor" />
              <path d="M17 9.5L20.5 7.16667C21.0523 6.79848 21.8 7.1942 21.8 7.86016V16.1398C21.8 16.8058 21.0523 17.2015 20.5 16.8333L17 14.5V9.5Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Messaging headers */}
        <h2 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
          Meeting not found
        </h2>
        <p className="mt-2 text-sm text-[#747487] max-w-sm">
          The meeting room link you are trying to reach doesn't exist, is invalid, or has already ended.
        </p>

        {/* Navigation Triggers */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center px-4">
          <Link
            href="/dashboard"
            className="flex h-[46px] items-center justify-center rounded-lg bg-[#0B5CFF] px-6 text-sm font-bold text-white shadow-sm hover:bg-[#0E72ED] transition-all"
          >
            Go to Home
          </Link>
          <Link
            href="/meeting/join"
            className="flex h-[46px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-white px-6 text-sm font-bold text-[#1F1F1F] hover:bg-[#F3F3F3] transition-all"
          >
            Join a Meeting
          </Link>
        </div>

      </div>

      {/* Helpful footer tips */}
      <div className="absolute bottom-6 flex items-center gap-1 text-[11px] text-[#747487]">
        <HelpCircle className="h-3.5 w-3.5" />
        <span>Double check your 10-digit meeting ID with the host.</span>
      </div>

    </div>
  );
}
