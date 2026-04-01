"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/groups", label: "CDS Groups", icon: "🏢" },
  { href: "/admin/signup-requests", label: "Signup Requests", icon: "📋" },
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
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const memberLinks = [
  { href: "/portal", label: "Dashboard", icon: "📊" },
  { href: "/portal/members", label: "Group Members", icon: "👥" },
  { href: "/portal/payments", label: "My Payments", icon: "💰" },
  { href: "/portal/shortcode", label: "Generate Code", icon: "🔑" },
  { href: "/portal/ledger", label: "Ledger", icon: "📒" },
  { href: "/portal/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const role = session?.user?.role;
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-primary">CDS Finance</h1>
        </div>
        <span className="text-xs text-text-secondary">{session?.user?.name}</span>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-border min-h-screen flex flex-col shadow-sm transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">CDS Finance</h1>
            <p className="text-xs text-text-secondary mt-1">Tracker</p>
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 mb-3">
            <p className="text-sm font-medium text-text truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-text-secondary">
              {roleLabel} · {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
