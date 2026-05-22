import React from "react";

interface SkeletonProps {
  count?: number;
}

export function MeetingCardSkeleton({ count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-4 animate-pulse w-full"
        >
          {/* Title */}
          <div className="h-5 bg-[#E5E5E5] rounded-md w-[60%]" />
          
          {/* Info lines */}
          <div className="space-y-2">
            <div className="h-3 bg-[#E5E5E5] rounded-md w-[40%]" />
            <div className="h-3 bg-[#E5E5E5] rounded-md w-[30%]" />
          </div>

          {/* Button row */}
          <div className="flex items-center justify-between border-t border-[#F3F3F3] pt-3 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-8 bg-[#E5E5E5] rounded-md w-16" />
              <div className="h-8 bg-[#E5E5E5] rounded-md w-8" />
              <div className="h-8 bg-[#E5E5E5] rounded-md w-8" />
            </div>
            <div className="h-4 bg-[#E5E5E5] rounded-md w-24" />
          </div>
        </div>
      ))}
    </>
  );
}
