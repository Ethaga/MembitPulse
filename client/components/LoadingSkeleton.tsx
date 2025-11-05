import React from "react";

export default function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-6 bg-[#0b0b0b] rounded-md mb-3" />
      <div className="h-40 bg-[#070707] rounded-md mb-3" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-8 bg-[#0b0b0b] rounded-md" />
        <div className="h-8 bg-[#0b0b0b] rounded-md" />
        <div className="h-8 bg-[#0b0b0b] rounded-md" />
      </div>
    </div>
  );
}
