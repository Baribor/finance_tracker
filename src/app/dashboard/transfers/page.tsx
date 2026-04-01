"use client";

import { useEffect, useState, FormEvent } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface TransferRequest {
  _id: string;
  member: { _id: string; name: string; stateCode: string };
  fromGroup: { _id: string; name: string };
  toGroup: { _id: string; name: string };
  requestedBy: { _id: string; name: string };
  resolvedBy?: { _id: string; name: string };
  status: "pending" | "approved" | "rejected";
  resolvedAt?: string;
  createdAt: string;
}

type DialogAction = {
  type: "approve" | "reject";
  request: TransferRequest;
};

export default function TransfersPage() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateCode, setStateCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchRequests = async () => {
    const res = await fetch("/api/transfers");
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberStateCode: stateCode.trim() }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setStateCode("");
    setSuccess(`Transfer request created for ${data.member.name}`);
    fetchRequests();
  };

  const handleConfirm = async () => {
    if (!dialogAction) return;
    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(`/api/transfers/${dialogAction.request._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: dialogAction.type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${dialogAction.type} request`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
      setActionLoading(false);
      return;
    }

    setActionLoading(false);
    setDialogAction(null);
    fetchRequests();
  };

  const pendingIncoming = requests.filter(
    (r) => r.status === "pending" && r.fromGroup
  );
  const resolved = requests.filter((r) => r.status !== "pending");

  const dialogConfig = dialogAction
    ? {
        approve: {
          title: "Approve Transfer",
          message: `Approve the transfer of ${dialogAction.request.member.name} (${dialogAction.request.member.stateCode}) to ${dialogAction.request.toGroup.name}? The member will be moved immediately.`,
          confirmLabel: "Approve",
          variant: "primary" as const,
        },
        reject: {
          title: "Reject Transfer",
          message: `Reject the transfer request for ${dialogAction.request.member.name} (${dialogAction.request.member.stateCode})?`,
          confirmLabel: "Reject",
          variant: "danger" as const,
        },
      }[dialogAction.type]
    : null;

  return (
    <div>
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Member Transfers</h1>
        <p className="text-text-secondary text-sm mt-1">
          Request and manage inter-group member transfers
        </p>
      </div>

      {/* Request Transfer Form */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-text mb-4">
          Request Member Transfer
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Enter the state code of a member from another group to request their
          transfer to your group. The member&apos;s current group secretary must
          approve the request.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-success text-sm p-3 rounded-lg border border-green-200">
              {success}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              placeholder="Enter member's state code"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? "Requesting..." : "Request Transfer"}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Pending Requests (needing action from this secretary) */}
          {pendingIncoming.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-border bg-amber-50">
                <h2 className="text-sm font-semibold text-amber-800">
                  Pending Requests ({pendingIncoming.length})
                </h2>
                <p className="text-xs text-amber-600 mt-0.5">
                  These requests require your action
                </p>
              </div>
              <div className="divide-y divide-border">
                {pendingIncoming.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">
                        {r.member.name}{" "}
                        <span className="font-mono text-xs text-text-secondary">
                          ({r.member.stateCode})
                        </span>
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {r.fromGroup.name} → {r.toGroup.name} · Requested by{" "}
                        {r.requestedBy.name} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setDialogAction({ type: "approve", request: r })
                        }
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setDialogAction({ type: "reject", request: r })
                        }
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-danger bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-alt">
              <h2 className="text-sm font-semibold text-text">
                Transfer History
              </h2>
            </div>
            {resolved.length === 0 && pendingIncoming.length === 0 ? (
              <p className="p-8 text-center text-sm text-text-secondary">
                No transfer requests yet.
              </p>
            ) : resolved.length === 0 ? (
              <p className="p-8 text-center text-sm text-text-secondary">
                No resolved transfers yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {resolved.map((r) => (
                  <div key={r._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text">
                          {r.member.name}{" "}
                          <span className="font-mono text-xs text-text-secondary">
                            ({r.member.stateCode})
                          </span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {r.fromGroup.name} → {r.toGroup.name} · Requested by{" "}
                          {r.requestedBy.name}
                          {r.resolvedBy &&
                            ` · ${r.status === "approved" ? "Approved" : "Rejected"} by ${r.resolvedBy.name}`}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          r.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : r.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
