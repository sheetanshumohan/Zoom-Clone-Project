"use client";

import React, { useState } from "react";
import { Search, UserPlus, Star, Phone, Video, Mail, Plus, X, ChevronRight, MessageSquare, Shield } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "online" | "offline" | "busy" | "away";
  avatarColor: string;
  isStarred: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Alice Johnson", email: "alice.j@example.com", role: "Product Manager", status: "online", avatarColor: "#0B5CFF", isStarred: true },
    { id: "2", name: "Bob Smith", email: "bob.smith@example.com", role: "Frontend Lead", status: "busy", avatarColor: "#E34040", isStarred: true },
    { id: "3", name: "Carol Danvers", email: "carol.d@example.com", role: "QA Engineer", status: "away", avatarColor: "#22C55E", isStarred: false },
    { id: "4", name: "David Miller", email: "david.m@example.com", role: "UX Designer", status: "offline", avatarColor: "#EAB308", isStarred: false },
    { id: "5", name: "Eva Long", email: "eva.l@example.com", role: "Backend Engineer", status: "online", avatarColor: "#A855F7", isStarred: false },
  ]);

  const [selectedContactId, setSelectedContactId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    const colors = ["#0B5CFF", "#E34040", "#22C55E", "#EAB308", "#A855F7", "#EC4899", "#F97316"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
      role: newRole || "Member",
      status: "online",
      avatarColor: randomColor,
      isStarred: false,
    };

    setContacts((prev) => [...prev, newContact]);
    setSelectedContactId(newContact.id);
    setIsAddModalOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("");
    toast.success("Contact added successfully!");
  };

  const toggleStar = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isStarred: !c.isStarred } : c))
    );
    toast.success("Contact preference updated");
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden">
      {/* Left panel: Directory list */}
      <div className="flex w-[320px] flex-col rounded-xl border border-[#E5E5E5]/50 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F1F1F]">Directory</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0B5CFF] hover:bg-[#D4E4FF] transition-all"
            title="Add Contact"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#747487]" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] py-2 pl-9 pr-4 text-xs text-[#1F1F1F] outline-none focus:border-[#0B5CFF] focus:bg-white transition-all"
          />
        </div>

        {/* List of contacts */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Starred section */}
          {filteredContacts.some((c) => c.isStarred) && (
            <div>
              <span className="text-[10px] font-bold text-[#747487] uppercase tracking-wider mb-2 block">Starred</span>
              <div className="space-y-1">
                {filteredContacts
                  .filter((c) => c.isStarred)
                  .map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                        selectedContactId === contact.id ? "bg-[#EBF2FF]" : "hover:bg-[#F3F3F3]"
                      }`}
                    >
                      <div className="relative">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner"
                          style={{ backgroundColor: contact.avatarColor }}
                        >
                          {contact.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            contact.status === "online"
                              ? "bg-green-500"
                              : contact.status === "busy"
                              ? "bg-red-500"
                              : contact.status === "away"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-[#1F1F1F] truncate">{contact.name}</h4>
                        <p className="text-[10px] text-[#747487] truncate">{contact.role}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* All contacts section */}
          <div>
            <span className="text-[10px] font-bold text-[#747487] uppercase tracking-wider mb-2 block">All Contacts</span>
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                    selectedContactId === contact.id ? "bg-[#EBF2FF]" : "hover:bg-[#F3F3F3]"
                  }`}
                >
                  <div className="relative">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner"
                      style={{ backgroundColor: contact.avatarColor }}
                    >
                      {contact.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        contact.status === "online"
                          ? "bg-green-500"
                          : contact.status === "busy"
                          ? "bg-red-500"
                          : contact.status === "away"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#1F1F1F] truncate">{contact.name}</h4>
                    <p className="text-[10px] text-[#747487] truncate">{contact.role}</p>
                  </div>
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <p className="text-xs text-[#747487] py-4 text-center">No contacts found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Profile view */}
      {selectedContact && (
        <div className="flex-1 flex flex-col rounded-xl border border-[#E5E5E5]/50 bg-white p-6 shadow-sm overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-inner"
                  style={{ backgroundColor: selectedContact.avatarColor }}
                >
                  {selectedContact.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                    selectedContact.status === "online"
                      ? "bg-green-500"
                      : selectedContact.status === "busy"
                      ? "bg-red-500"
                      : selectedContact.status === "away"
                      ? "bg-amber-500"
                      : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1F1F1F]">{selectedContact.name}</h1>
                <p className="text-xs text-[#747487] font-medium mt-0.5">{selectedContact.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    selectedContact.status === "online" ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  <span className="text-[11px] font-semibold text-[#747487] capitalize">{selectedContact.status}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleStar(selectedContact.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E5E5] hover:bg-[#F3F3F3] transition-all`}
            >
              <Star
                className={`h-5 w-5 ${
                  selectedContact.isStarred ? "fill-[#EAB308] text-[#EAB308]" : "text-[#747487]"
                }`}
              />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4 my-6">
            <button
              onClick={() => toast.info(`Starting instant chat with ${selectedContact.name}...`)}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5]/50 bg-[#F7F7F7] py-4 text-xs font-bold text-[#1F1F1F] hover:bg-[#EBF2FF] hover:text-[#0B5CFF] hover:border-[#0B5CFF]/30 transition-all gap-1.5"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => toast.info(`Calling ${selectedContact.name}...`)}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5]/50 bg-[#F7F7F7] py-4 text-xs font-bold text-[#1F1F1F] hover:bg-[#EBF2FF] hover:text-[#0B5CFF] hover:border-[#0B5CFF]/30 transition-all gap-1.5"
            >
              <Phone className="h-5 w-5" />
              <span>Call</span>
            </button>
            <button
              onClick={() => toast.info(`Starting video meeting with ${selectedContact.name}...`)}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5E5E5]/50 bg-[#F7F7F7] py-4 text-xs font-bold text-[#1F1F1F] hover:bg-[#EBF2FF] hover:text-[#0B5CFF] hover:border-[#0B5CFF]/30 transition-all gap-1.5"
            >
              <Video className="h-5 w-5" />
              <span>Meet</span>
            </button>
          </div>

          {/* Detailed Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#747487] uppercase tracking-wider">Contact Info</h3>
            <div className="space-y-3 rounded-xl border border-[#E5E5E5]/50 bg-[#FBFBFB] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#747487]">Email Address</span>
                <span className="font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#747487]" />
                  {selectedContact.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#747487]">Job Title</span>
                <span className="font-semibold text-[#1F1F1F]">{selectedContact.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#747487]">Presence</span>
                <span className="font-semibold text-[#1F1F1F] capitalize">{selectedContact.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#E5E5E5]">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-4">
              <h3 className="text-base font-bold text-[#1F1F1F]">Add New Contact</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F3F3]"
              >
                <X className="h-4 w-4 text-[#747487]" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#747487] uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-[#1F1F1F] outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#747487] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. alice@company.com"
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-[#1F1F1F] outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#747487] uppercase tracking-wider mb-1.5">
                  Job Role / Title
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. UX Designer"
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-[#1F1F1F] outline-none focus:border-[#0B5CFF]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-xs font-semibold hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0B5CFF] hover:bg-[#0E72ED] px-4 py-2 text-xs font-semibold text-white"
                >
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
