"use client";

import { useState, useEffect, useRef, FormEvent } from "react";

interface Message {
  sender: string;
  senderRole: "user" | "admin";
  content: string;
  createdAt: string;
}

interface TicketData {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  status: "open" | "closed";
  messages: Message[];
}

const STORAGE_KEY = "cds_support_ticket_id";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "new" | "resume" | "chat">("menu");
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New ticket form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Chat input
  const [chatMessage, setChatMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasExistingTicket, setHasExistingTicket] = useState(false);

  // Check for existing ticket in localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTicketId(saved);
      setHasExistingTicket(true);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // Poll for new messages when in chat view
  useEffect(() => {
    if (view === "chat" && ticket?.ticketId && ticket.status === "open") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/support/${ticket.ticketId}`);
          if (res.ok) {
            const data = await res.json();
            setTicket(data);
          }
        } catch {
          // ignore poll errors
        }
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, ticket?.ticketId, ticket?.status]);

  const loadTicket = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/support/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ticket not found");
        setLoading(false);
        return;
      }
      setTicket(data);
      setTicketId(data.ticketId);
      localStorage.setItem(STORAGE_KEY, data.ticketId);
      setView("chat");
    } catch {
      setError("Failed to load ticket");
    }
    setLoading(false);
  };

  const handleNewTicket = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create ticket");
        setLoading(false);
        return;
      }
      localStorage.setItem(STORAGE_KEY, data.ticketId);
      await loadTicket(data.ticketId);
    } catch {
      setError("Failed to create ticket");
    }
    setLoading(false);
  };

  const handleResume = async (e: FormEvent) => {
    e.preventDefault();
    await loadTicket(ticketId.trim());
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !ticket) return;
    setSending(true);

    try {
      const res = await fetch(`/api/support/${ticket.ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        setChatMessage("");
      }
    } catch {
      // ignore
    }
    setSending(false);
  };

  const handleBack = () => {
    setView("menu");
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
    setError("");
    if (!ticket) setView("menu");
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            // Auto-resume if there's a saved ticket
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && !ticket) {
              setTicketId(saved);
              loadTicket(saved);
            }
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-105 flex items-center justify-center"
          aria-label="Support chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {hasExistingTicket && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] h-full sm:h-auto sm:max-h-[520px] flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {view !== "menu" && view !== "chat" && (
                <button onClick={handleBack} className="hover:bg-white/20 rounded p-0.5 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <p className="text-sm font-semibold">Support</p>
                {ticket && view === "chat" && (
                  <p className="text-[10px] text-white/70 font-mono">{ticket.ticketId}</p>
                )}
              </div>
            </div>
            <button onClick={handleClose} className="hover:bg-white/20 rounded p-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Menu view */}
            {view === "menu" && (
              <div className="p-5 space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text">How can we help?</h3>
                  <p className="text-xs text-text-secondary mt-1">Get in touch with our support team</p>
                </div>
                <button
                  onClick={() => setView("new")}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">New Conversation</p>
                    <p className="text-xs text-text-secondary">Start a new support request</p>
                  </div>
                </button>
                <button
                  onClick={() => setView("resume")}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-200">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Resume Conversation</p>
                    <p className="text-xs text-text-secondary">Continue with your ticket ID</p>
                  </div>
                </button>
              </div>
            )}

            {/* New ticket form */}
            {view === "new" && (
              <div className="p-4">
                <form onSubmit={handleNewTicket} className="space-y-3">
                  {error && (
                    <div className="text-xs text-danger bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-[10px] text-text-secondary mt-0.5">Your ticket ID will be sent here</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                      rows={3}
                      placeholder="Describe your issue in detail..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Submit"}
                  </button>
                </form>
              </div>
            )}

            {/* Resume ticket */}
            {view === "resume" && (
              <div className="p-5">
                <form onSubmit={handleResume} className="space-y-3">
                  {error && (
                    <div className="text-xs text-danger bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-text mb-1">Ticket ID</label>
                    <input
                      type="text"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="TKT-XXXXXXXX"
                      required
                    />
                    <p className="text-[10px] text-text-secondary mt-0.5">Enter the ticket ID from your email</p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Resume Chat"}
                  </button>
                </form>
              </div>
            )}

            {/* Chat view */}
            {view === "chat" && ticket && (
              <div className="flex flex-col h-[calc(100vh-52px)] sm:h-[400px]">
                {/* Ticket info */}
                <div className="px-4 py-2 bg-surface-alt border-b border-border shrink-0">
                  <p className="text-xs font-medium text-text truncate">{ticket.subject}</p>
                  <p className="text-[10px] text-text-secondary">
                    {ticket.status === "open" ? "🟢 Open" : "🔴 Closed"}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ticket.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          msg.senderRole === "user"
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-surface-alt text-text border border-border rounded-bl-sm"
                        }`}
                      >
                        <p className={`text-[10px] font-medium mb-0.5 ${
                          msg.senderRole === "user" ? "text-white/70" : "text-text-secondary"
                        }`}>
                          {msg.senderRole === "admin" ? `${msg.sender} (Support)` : msg.sender}
                        </p>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${
                          msg.senderRole === "user" ? "text-white/50" : "text-text-secondary/60"
                        }`}>
                          {new Date(msg.createdAt).toLocaleString("en-NG", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {ticket.status === "open" ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-border flex gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !chatMessage.trim()}
                      className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-border text-center">
                    <p className="text-xs text-text-secondary">This ticket has been closed.</p>
                    <button
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setTicket(null);
                        setTicketId("");
                        setView("menu");
                      }}
                      className="text-xs text-primary font-medium mt-1 hover:underline"
                    >
                      Start a new conversation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
