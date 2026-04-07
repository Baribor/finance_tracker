"use client";

import { useEffect, useState, FormEvent, useRef } from "react";

interface Message {
  sender: string;
  senderRole: "user" | "admin";
  content: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  status: "open" | "closed";
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    const res = await fetch("/api/admin/support");
    if (res.ok) {
      const data = await res.json();
      setTickets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReply("");
  };

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);

    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.ticketId,
        message: reply,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === updated.ticketId ? updated : t))
      );
      setReply("");
    }
    setSending(false);
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    const res = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId: selectedTicket.ticketId,
        action: "close",
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === updated.ticketId ? updated : t))
      );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  const openCount = tickets.filter((t) => t.status === "open").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Support Tickets</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage and respond to user support requests
        </p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Ticket list */}
        <div className="w-[360px] shrink-0 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["all", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "open" && openCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Ticket items */}
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-secondary">
                No {filter !== "all" ? filter : ""} tickets
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket._id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-border hover:bg-surface-alt/50 transition-colors ${
                    selectedTicket?.ticketId === ticket.ticketId
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {ticket.name} · {ticket.email}
                      </p>
                    </div>
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
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-text-secondary font-mono">
                      {ticket.ticketId}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {new Date(ticket.updatedAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 truncate">
                    {ticket.messages[ticket.messages.length - 1]?.content}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-semibold text-text">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {selectedTicket.name} ({selectedTicket.email}) ·{" "}
                    <span className="font-mono">{selectedTicket.ticketId}</span>
                  </p>
                </div>
                {selectedTicket.status === "open" && (
                  <button
                    onClick={handleClose}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-red-50 hover:text-danger hover:border-red-200 transition-colors font-medium"
                  >
                    Close Ticket
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {selectedTicket.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.senderRole === "admin" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        msg.senderRole === "admin"
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-surface-alt text-text border border-border rounded-bl-sm"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-medium mb-1 ${
                          msg.senderRole === "admin"
                            ? "text-white/70"
                            : "text-text-secondary"
                        }`}
                      >
                        {msg.senderRole === "admin"
                          ? `${msg.sender} (You)`
                          : msg.sender}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[9px] mt-1 ${
                          msg.senderRole === "admin"
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

              {/* Reply */}
              {selectedTicket.status === "open" ? (
                <form
                  onSubmit={handleReply}
                  className="p-4 border-t border-border flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Type your reply..."
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Reply"}
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-border text-center">
                  <p className="text-sm text-text-secondary">
                    This ticket is closed.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-text-secondary">
                  Select a ticket to view the conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
