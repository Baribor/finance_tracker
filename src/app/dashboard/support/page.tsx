"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useSession } from "next-auth/react";

interface Message {
  sender: string;
  senderRole: "user" | "admin";
  content: string;
  createdAt: string;
}

interface Ticket {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  status: "open" | "closed";
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "cds_support_ticket_ids";

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  // New ticket
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved ticket IDs and fetch them
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
    if (stored.length > 0) {
      setLoading(true);
      Promise.all(
        stored.map((id) =>
          fetch(`/api/support/${id}`).then((r) => (r.ok ? r.json() : null))
        )
      )
        .then((results) => {
          setTickets(results.filter(Boolean));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  // Poll for updates on selected ticket
  useEffect(() => {
    if (!selectedTicket || selectedTicket.status !== "open") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/${selectedTicket.ticketId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedTicket(data);
          setTickets((prev) =>
            prev.map((t) => (t.ticketId === data.ticketId ? data : t))
          );
        }
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTicket?.ticketId, selectedTicket?.status]);

  const saveTicketId = (id: string) => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
    if (!stored.includes(id)) {
      stored.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  };

  const handleCreateTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setCreating(true);
    setError("");

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: session.user.name,
        email: session.user.email || "no-email@placeholder.com",
        subject,
        message,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error || "Failed to create ticket");
      return;
    }

    saveTicketId(data.ticketId);

    // Load the new ticket
    const ticketRes = await fetch(`/api/support/${data.ticketId}`);
    if (ticketRes.ok) {
      const ticket = await ticketRes.json();
      setTickets((prev) => [ticket, ...prev]);
      setSelectedTicket(ticket);
    }

    setSubject("");
    setMessage("");
    setShowNew(false);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedTicket) return;
    setSending(true);

    const res = await fetch(`/api/support/${selectedTicket.ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: chatMessage,
        sender: session?.user.name,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedTicket(data);
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === data.ticketId ? data : t))
      );
      setChatMessage("");
    }
    setSending(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Support</h1>
          <p className="text-text-secondary text-sm mt-1">
            Get help from the admin team
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {showNew ? "Cancel" : "+ New Ticket"}
        </button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Create Support Ticket
          </h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                placeholder="Brief description of your issue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                rows={4}
                placeholder="Describe your issue in detail..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {creating ? "Creating..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tickets.length === 0 && !showNew ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm text-text-secondary">
            No support tickets yet. Click &quot;+ New Ticket&quot; to get help.
          </p>
        </div>
      ) : (
        <div className="flex gap-6 min-h-[400px]">
          {/* Ticket list */}
          <div className="w-[320px] shrink-0 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {tickets.map((ticket) => (
                <button
                  key={ticket.ticketId}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setChatMessage("");
                  }}
                  className={`w-full text-left p-4 hover:bg-surface-alt/50 transition-colors ${
                    selectedTicket?.ticketId === ticket.ticketId
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text truncate">
                      {ticket.subject}
                    </p>
                    <span
                      className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        ticket.status === "open"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary font-mono mt-1">
                    {ticket.ticketId}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 truncate">
                    {ticket.messages[ticket.messages.length - 1]?.content}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="px-5 py-3 border-b border-border shrink-0">
                  <h2 className="text-sm font-semibold text-text">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    <span className="font-mono">{selectedTicket.ticketId}</span> ·{" "}
                    {selectedTicket.status === "open" ? "🟢 Open" : "🔴 Closed"}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {selectedTicket.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.senderRole === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                          msg.senderRole === "user"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-surface-alt text-text border border-border rounded-bl-sm"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-medium mb-1 ${
                            msg.senderRole === "user"
                              ? "text-white/70"
                              : "text-text-secondary"
                          }`}
                        >
                          {msg.senderRole === "admin"
                            ? `${msg.sender} (Support)`
                            : msg.sender}
                        </p>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-[9px] mt-1 ${
                            msg.senderRole === "user"
                              ? "text-white/50"
                              : "text-text-secondary/60"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString("en-NG", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {selectedTicket.status === "open" ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-border flex gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !chatMessage.trim()}
                      className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>
                ) : (
                  <div className="p-4 border-t border-border text-center">
                    <p className="text-xs text-text-secondary">
                      This ticket is closed.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-text-secondary">
                  Select a ticket to view messages
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
