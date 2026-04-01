"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface SignupRequest {
  _id: string;
  groupName: string;
  groupDescription: string;
  secretaryName: string;
  secretaryStateCode: string;
  lga: string;
  state: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: { name: string };
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

type DialogAction = { type: "approve" | "reject"; request: SignupRequest };

export default function SignupRequestsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAction, setDialogAction] = useState<DialogAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchRequests = async () => {
    const res = await fetch("/api/admin/signup-requests");
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirm = async () => {
    if (!dialogAction) return;
    setActionLoading(true);
    setActionError("");

    try {
      const res = await fetch(
        `/api/admin/signup-requests/${dialogAction.request._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: dialogAction.type,
            rejectionReason:
              dialogAction.type === "reject" ? rejectionReason : undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
      setActionLoading(false);
      return;
    }

    setActionLoading(false);
    setDialogAction(null);
    setRejectionReason("");
    fetchRequests();
  };

  const filtered = requests.filter(
    (r) => filter === "all" || r.status === filter
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const statusBadge = (status: SignupRequest["status"]) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  const dialogConfig = dialogAction
    ? dialogAction.type === "approve"
      ? {
          title: "Approve Registration",
          message: actionError || `Create group "${dialogAction.request.groupName}" and activate the secretary account for ${dialogAction.request.secretaryName} (${dialogAction.request.secretaryStateCode})?`,
          confirmLabel: "Approve & Create",
          variant: "primary" as const,
        }
      : {
          title: "Reject Registration",
          message: actionError || `Reject the request from ${dialogAction.request.secretaryName} for "${dialogAction.request.groupName}"?`,
          confirmLabel: "Reject",
          variant: "danger" as const,
        }
    : null;

  return (
    <div>
      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!dialogAction}
        title={dialogConfig?.title || ""}
        message={dialogConfig?.message || ""}
        confirmLabel={actionError ? "Retry" : dialogConfig?.confirmLabel}
        variant={dialogConfig?.variant}
        loading={actionLoading}
        onConfirm={actionError ? () => setActionError("") : handleConfirm}
        onCancel={() => {
          setDialogAction(null);
          setRejectionReason("");
          setActionError("");
        }}
      >
        {/* Extra slot for rejection reason */}
        {dialogAction?.type === "reject" && !actionError && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-text mb-1">
              Reason (optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Optional reason shown in request history"
            />
          </div>
        )}
      </ConfirmDialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            Signup Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Review and approve new CDS group registrations
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-surface-alt rounded-lg p-1 self-start sm:self-auto">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? "bg-white text-text shadow-sm"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 text-center text-sm text-text-secondary">
          No {filter === "all" ? "" : filter} requests.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-xl border border-border shadow-sm p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-text">{r.groupName}</h3>
                    {statusBadge(r.status)}
                  </div>
                  {r.groupDescription && (
                    <p className="text-xs text-text-secondary mb-2">
                      {r.groupDescription}
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-text-secondary">
                    {r.lga && (
                      <span>
                        <span className="font-medium">LGA:</span> {r.lga}
                      </span>
                    )}
                    {r.state && (
                      <span>
                        <span className="font-medium">State:</span> {r.state}
                      </span>
                    )}
                    <span>
                      <span className="font-medium">Secretary:</span>{" "}
                      {r.secretaryName}
                    </span>
                    <span>
                      <span className="font-medium">Code:</span>{" "}
                      <span className="font-mono">{r.secretaryStateCode}</span>
                    </span>
                    <span className="col-span-2">
                      <span className="font-medium">Submitted:</span>{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {r.reviewedBy && r.reviewedAt && (
                      <span className="col-span-2">
                        <span className="font-medium">
                          {r.status === "approved" ? "Approved" : "Rejected"} by:
                        </span>{" "}
                        {r.reviewedBy.name} on{" "}
                        {new Date(r.reviewedAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {r.rejectionReason && (
                      <span className="col-span-full text-danger">
                        <span className="font-medium">Reason:</span>{" "}
                        {r.rejectionReason}
                      </span>
                    )}
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setDialogAction({ type: "approve", request: r })
                      }
                      className="bg-primary text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectionReason("");
                        setDialogAction({ type: "reject", request: r });
                      }}
                      className="text-danger bg-red-50 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
