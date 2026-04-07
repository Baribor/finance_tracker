"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/groups", label: "CDS Groups", icon: "🏢" },
  { href: "/admin/signup-requests", label: "Signup Requests", icon: "📋" },
  { href: "/admin/support", label: "Support Tickets", icon: "💬" },
];

const secretaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/members", label: "Members", icon: "👥" },
  { href: "/dashboard/transfers", label: "Transfers", icon: "🔄" },
  { href: "/dashboard/categories", label: "Categories", icon: "📁" },
  { href: "/dashboard/payments", label: "Payments", icon: "💰" },
  { href: "/dashboard/shortcode", label: "Short Code", icon: "🔑" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "📤" },
  { href: "/dashboard/ledger", label: "Ledger", icon: "📒" },
  { href: "/dashboard/support", label: "Support", icon: "💬" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const memberLinks = [
  { href: "/portal", label: "Dashboard", icon: "📊" },
  { href: "/portal/members", label: "Group Members", icon: "👥" },
  { href: "/portal/payments", label: "My Payments", icon: "💰" },
  { href: "/portal/shortcode", label: "Generate Code", icon: "🔑" },
  { href: "/portal/ledger", label: "Ledger", icon: "📒" },
  { href: "/portal/support", label: "Support", icon: "💬" },
  { href: "/portal/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [pendingSignups, setPendingSignups] = useState(0);
  const [groupName, setGroupName] = useState<string | null>(null);

  const role = session?.user?.role;

  useEffect(() => {
    if (role === "admin") {
      fetch("/api/admin/signup-requests/count")
        .then((r) => r.json())
        .then((d) => setPendingSignups(d.pending ?? 0))
        .catch(() => {});
    }
    if (role === "secretary" || role === "member") {
      fetch("/api/groups/me")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.name) setGroupName(d.name); })
        .catch(() => {});
    }
  }, [role]);

  const links =
    role === "admin"
      ? adminLinks
      : role === "secretary"
      ? secretaryLinks
      : memberLinks;

  const roleLabel =
    role === "admin" ? "Admin" : role === "secretary" ? "Secretary" : "Member";

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">₦</span>
            </div>
            <span className="text-sm font-bold text-text">CDS Finance</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {groupName && (
            <span className="text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded-md hidden sm:block">
              {groupName}
            </span>
          )}
          <span className="text-xs text-text-secondary">{session?.user?.name?.split(" ")[0]}</span>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-border min-h-screen flex flex-col transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">₦</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-text leading-tight">CDS Finance</h1>
              <p className="text-[10px] text-text-secondary leading-tight">Tracker</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-surface-alt"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Group badge (non-admin) */}
        {groupName && (
          <div className="px-4 pt-4">
            <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-text-secondary uppercase tracking-wider leading-none">CDS Group</p>
                <p className="text-xs font-semibold text-primary truncate mt-0.5">{groupName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 mt-1 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const showBadge =
              link.href === "/admin/signup-requests" && pendingSignups > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text"
                }`}
              >
                <span className="text-base w-5 text-center">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                {showBadge && (
                  <span className="min-w-[20px] h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                    {pendingSignups > 99 ? "99+" : pendingSignups}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2.5 mb-2 bg-surface-alt rounded-lg">
            <p className="text-sm font-medium text-text truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {roleLabel}{session?.user?.email ? ` · ${session.user.email}` : ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
