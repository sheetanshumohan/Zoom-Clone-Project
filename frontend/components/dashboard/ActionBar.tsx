"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, PlusSquare, Calendar, ScreenShare } from "lucide-react";
import { toast } from "sonner";

export default function ActionBar() {
  const router = useRouter();
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format: 10:42 AM
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );

      // Format: Thursday, May 21
      setDateStr(
        now.toLocaleTimeString("en-US", { weekday: "long", month: "long", day: "numeric" }).split(",")[0] +
        ", " +
        now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShareScreen = () => {
    toast.info("Select a meeting to join with screen sharing enabled, or enter a meeting ID.");
    router.push("/meeting/join?share=true");
  };

  const actionButtons = [
    {
      label: "New Meeting",
      icon: Video,
      colorClass: "bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white",
      iconColor: "text-white",
      onClick: () => router.push("/meeting/new"),
    },
    {
      label: "Join",
      icon: PlusSquare,
      colorClass: "bg-[#0B5CFF] text-white",
      iconColor: "text-white",
      onClick: () => router.push("/meeting/join"),
    },
    {
      label: "Schedule",
      icon: Calendar,
      colorClass: "bg-white border border-[#E5E5E5] text-[#1F1F1F]",
      iconColor: "text-[#0B5CFF]",
      onClick: () => router.push("/meeting/schedule"),
    },
    {
      label: "Share Screen",
      icon: ScreenShare,
      colorClass: "bg-white border border-[#E5E5E5] text-[#1F1F1F]",
      iconColor: "text-[#0B5CFF]",
      onClick: handleShareScreen,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Large Action Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actionButtons.map((btn, index) => {
          const Icon = btn.icon;
          return (
            <div
              key={index}
              onClick={btn.onClick}
              className={`flex h-[130px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl p-4 shadow-sm transition-all duration-200 hover:scale-[1.03] ${btn.colorClass}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <Icon className={`h-9 w-9 ${btn.iconColor}`} />
              </div>
              <span className="text-sm font-bold text-center leading-tight">
                {btn.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Real-time Time and Date Display */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-[#E5E5E5]/50">
        <h2 className="text-5xl font-extrabold tracking-tight text-[#1F1F1F] tabular-nums">
          {time || "00:00 AM"}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#747487]">
          {dateStr || "Loading..."}
        </p>
      </div>
    </div>
  );
}
