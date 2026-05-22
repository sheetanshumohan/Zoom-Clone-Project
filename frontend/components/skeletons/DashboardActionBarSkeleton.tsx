import React from "react";

interface SkeletonProps {
  count?: number;
}

export function DashboardActionBarSkeleton({ count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-wrap gap-4 animate-pulse w-full">
          {Array.from({ length: 4 }).map((_, cardIdx) => (
            <div
              key={cardIdx}
              className="h-[130px] w-[150px] rounded-xl bg-white border border-[#E5E5E5] p-4 flex flex-col justify-between"
            >
              <div className="h-10 w-10 rounded-xl bg-[#E5E5E5]" />
              <div className="h-4 bg-[#E5E5E5] rounded-md w-[70%]" />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
