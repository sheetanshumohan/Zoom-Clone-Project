"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F3F3F3]">
      {/* Fixed Top Navbar */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen(true)} />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden pt-[56px] relative">
        {/* Sidebar (collapsible on mobile, fixed on desktop) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:pl-[236px] transition-all duration-200">
          <div className="mx-auto max-w-5xl animate-in fade-in duration-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
