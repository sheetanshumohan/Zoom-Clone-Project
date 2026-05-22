import React from "react";

interface SkeletonProps {
  count?: number;
}

export function ParticipantRowSkeleton({ count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg animate-pulse w-full">
          {/* Avatar circle */}
          <div className="h-8 w-8 rounded-full bg-[#E5E5E5] shrink-0" />
          
          {/* Text lines */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3.5 bg-[#E5E5E5] rounded-md w-[50%]" />
            <div className="h-2.5 bg-[#E5E5E5] rounded-md w-[30%]" />
          </div>

          {/* Right badge */}
          <div className="h-5 bg-[#E5E5E5] rounded-full w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}
