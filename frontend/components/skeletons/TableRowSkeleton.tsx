import React from "react";

interface SkeletonProps {
  count?: number;
}

export function TableRowSkeleton({ count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <tr key={idx} className="border-b border-[#E5E5E5] animate-pulse">
          <td className="px-4 py-4">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[80%]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[60%]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[80%]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[40%]" />
          </td>
          <td className="px-4 py-4 text-center">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[30%] mx-auto" />
          </td>
          <td className="px-4 py-4 text-right">
            <div className="h-4 bg-[#E5E5E5] rounded-md w-[40%] ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
