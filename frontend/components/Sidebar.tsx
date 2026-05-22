"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Phone, Video, Users, PenTool, HelpCircle, Shield, X } from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      label: "Chat",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname.startsWith("/chat"),
    },
    {
      label: "Phone",
      href: "/phone",
      icon: Phone,
      isActive: pathname.startsWith("/phone"),
    },
    {
      label: "Meetings",
      href: "/meetings",
      icon: Video,
      isActive: pathname.startsWith("/meetings") || pathname.includes("/meeting/new") || pathname.includes("/meeting/schedule") || pathname.includes("/meeting/join"),
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: Users,
      isActive: pathname.startsWith("/contacts"),
    },
    {
      label: "Whiteboard",
      href: "/whiteboard",
      icon: PenTool,
      isActive: pathname.startsWith("/whiteboard"),
    },
  ];

  const handleNavClick = () => {
    onClose(); // Close sidebar on mobile
  };

  const handleUpgrade = () => {
    toast.success("Upgrade Plan modal opened: Basic to Pro $14.99/mo");
  };

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed bottom-0 top-[56px] left-0 z-45 w-[220px] flex-col border-r border-[#E5E5E5] bg-white pt-4 transition-transform duration-200 ease-in-out md:flex md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header: Close Button inside Sidebar */}
        <div className="flex items-center justify-between px-4 pb-2 md:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-[#747487]">Navigation</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F3F3]"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-[2px] px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                  item.isActive
                    ? "bg-[#E8F0FE] text-[#0B5CFF] font-semibold"
                    : "text-[#1F1F1F] hover:bg-[#F3F3F3] hover:text-[#1F1F1F]"
                }`}
              >
                {/* Active Indicator Blue Line on Left */}
                {item.isActive && (
                  <span className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-r-md bg-[#0B5CFF]" />
                )}
                <Icon className={`h-[18px] w-[18px] ${item.isActive ? "text-[#0B5CFF]" : "text-[#747487]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="border-t border-[#E5E5E5] p-4 space-y-3">
          {/* Upgrade Plan button outline style */}
          <button
            onClick={handleUpgrade}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#0B5CFF] bg-white px-3 py-2 text-xs font-semibold text-[#0B5CFF] transition-all hover:bg-[#0B5CFF] hover:text-white"
          >
            <Shield className="h-3.5 w-3.5" />
            Upgrade Plan
          </button>
          
          <Link
            href="#"
            onClick={() => {
              toast.info("Help & Documentation center");
              onClose();
            }}
            className="flex items-center gap-2 text-xs text-[#747487] hover:text-[#1F1F1F] px-1"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help & Support</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
