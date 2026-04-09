"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Member {
  _id: string;
  stateCode: string;
  name: string;
  role: string;
  isActive: boolean;
  serviceStatus: string;
  createdAt: string;
}

type DialogAction =
  | { type: "reset"; member: Member }
  | { type: "deactivate"; member: Member }
  | { type: "activate"; member: Member }
  | { type: "delete"; member: Member }
  | { type: "complete"; member: Member }
  | { type: "transfer-role"; member: Member };

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stateCode, setStateCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);
  const [actionError, setActionError] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchMembers = async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stateCode, name }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setStateCode("");
    setName("");
    setShowForm(false);
    fetchMembers();
  };

  const handleConfirm = async () => {
    if (!dialogAction) return;
    setActionLoading(true);
    setActionError("");

    try {
      let res: Response;

      switch (dialogAction.type) {
        case "reset":
          res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: dialogAction.member._id }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to reset password");
          }
          break;

        case "deactivate":
          res = await fetch(`/api/members/${dialogAction.member._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
          });
          if (!res.ok) throw new Error("Failed to deactivate member");
          break;

        case "activate":
          res = await fetch(`/api/members/${dialogAction.member._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: true }),
          });
          if (!res.ok) throw new Error("Failed to activate member");
          break;

        case "delete":
          res = await fetch(`/api/members/${dialogAction.member._id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete member");
          }
          break;

        case "complete":
          res = await fetch(`/api/members/${dialogAction.member._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceStatus: "completed" }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to mark service complete");
          }
          break;

        case "transfer-role":
          res = await fetch("/api/secretary/transfer-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: dialogAction.member._id }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to transfer role");
          }
          // After role transfer we need to reload the page since the current user is no longer secretary
          window.location.href = "/portal";
          return;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
      setActionLoading(false);
      return;
    }

    setActionLoading(false);
    setDialogAction(null);
    fetchMembers();
  };

  const dialogConfig = dialogAction
    ? {
        reset: {
          title: "Reset Password",
          message: `Reset ${dialogAction.member.name}'s password to their state code? They will be required to change it on next login.`,
          confirmLabel: "Reset Password",
          variant: "danger" as const,
        },
        deactivate: {
          title: "Deactivate Member",
          message: `Deactivate ${dialogAction.member.name}? They will no longer be able to log in.`,
          confirmLabel: "Deactivate",
          variant: "danger" as const,
        },
        activate: {
          title: "Activate Member",
          message: `Reactivate ${dialogAction.member.name}? They will be able to log in again.`,
          confirmLabel: "Activate",
          variant: "primary" as const,
        },
        delete: {
          title: "Delete Member",
          message: `Permanently delete ${dialogAction.member.name}? This cannot be undone. Members with payment records cannot be deleted.`,
          confirmLabel: "Delete Permanently",
          variant: "danger" as const,
        },
        complete: {
          title: "Mark Service Complete",
          message: `Mark ${dialogAction.member.name} as having completed service? They will only have read-only access to their historical records, and dashboard access will be disabled after one month.`,
          confirmLabel: "Mark Complete",
          variant: "danger" as const,
        },
        "transfer-role": {
          title: "Transfer Secretary Role",
          message: `Transfer the secretary role to ${dialogAction.member.name}? You will become a regular member and will be redirected to the member portal.`,
          confirmLabel: "Transfer Role",
          variant: "danger" as const,
        },
      }[dialogAction.type]
    : null;

  return (
    <div>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!dialogAction}
        title={dialogConfig?.title || ""}
        message={actionError || dialogConfig?.message || ""}
        confirmLabel={actionError ? "Retry" : dialogConfig?.confirmLabel}
        variant={dialogConfig?.variant}
        loading={actionLoading}
        onConfirm={actionError ? () => setActionError("") : handleConfirm}
        onCancel={() => {
          setDialogAction(null);
          setActionError("");
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Members</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage group members and onboarding
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors self-start"
        >
          {showForm ? "Cancel" : "+ Add Member"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Onboard New Member
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  State Code
                </label>
                <input
                  type="text"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="e.g. AB/23C/0001"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  This will also be the member&apos;s default password
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Member's full name"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Member"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  State Code
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Name
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Role
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Status
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Service
                </th>
                <th className="p-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member._id} className="hover:bg-surface-alt/50">
                  <td className="p-4">
                    <span className="font-mono text-sm font-medium text-text">
                      {member.stateCode}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text">{member.name}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === "secretary"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          member.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.serviceStatus === "completed"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {member.serviceStatus === "completed" ? "Completed" : "Serving"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {member.role !== "secretary" && (
                      <div className="relative inline-block" ref={openMenu === member._id ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenu(openMenu === member._id ? null : member._id)}
                          className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary hover:text-text"
                          title="Actions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                        {openMenu === member._id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                            <button
                              onClick={() => { setOpenMenu(null); setDialogAction({ type: "reset", member }); }}
                              className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-alt transition-colors"
                            >
                              Reset Password
                            </button>
                            {member.isActive && member.serviceStatus === "serving" && (
                              <button
                                onClick={() => { setOpenMenu(null); setDialogAction({ type: "transfer-role", member }); }}
                                className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                Make Secretary
                              </button>
                            )}
                            {member.isActive && member.serviceStatus === "serving" && (
                              <button
                                onClick={() => { setOpenMenu(null); setDialogAction({ type: "complete", member }); }}
                                className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                Complete Service
                              </button>
                            )}
                            <button
                              onClick={() => { setOpenMenu(null); setDialogAction({ type: member.isActive ? "deactivate" : "activate", member }); }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                member.isActive ? "text-danger hover:bg-red-50" : "text-success hover:bg-green-50"
                              }`}
                            >
                              {member.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <div className="border-t border-border my-1" />
                            <button
                              onClick={() => { setOpenMenu(null); setDialogAction({ type: "delete", member }); }}
                              className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {members.length === 0 && (
            <p className="p-8 text-center text-sm text-text-secondary">
              No members yet. Click &ldquo;Add Member&rdquo; to onboard
              someone.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
