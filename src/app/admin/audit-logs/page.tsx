"use client";

import { useEffect, useState, useCallback } from "react";

interface AuditLog {
  _id: string;
  action: string;
  performedBy: { name: string; stateCode: string; role: string } | null;
  targetType: string;
  group?: { name: string } | null;
  details: string;
  createdAt: string;
}

interface ApiResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
  actions: string[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "member.create": { label: "Member Created", color: "bg-green-100 text-green-700" },
  "member.delete": { label: "Member Deleted", color: "bg-red-100 text-red-700" },
  "member.deactivate": { label: "Member Deactivated", color: "bg-orange-100 text-orange-700" },
  "member.activate": { label: "Member Activated", color: "bg-green-100 text-green-700" },
  "member.service_completed": { label: "Service Completed", color: "bg-orange-100 text-orange-700" },
  "member.password_reset": { label: "Password Reset", color: "bg-amber-100 text-amber-700" },
  "secretary.transfer": { label: "Secretary Transfer", color: "bg-purple-100 text-purple-700" },
  "group.create": { label: "Group Created", color: "bg-blue-100 text-blue-700" },
  "signup_request.approve": { label: "Signup Approved", color: "bg-green-100 text-green-700" },
  "signup_request.reject": { label: "Signup Rejected", color: "bg-red-100 text-red-700" },
  "category.delete": { label: "Category Removed", color: "bg-red-100 text-red-700" },
  "transfer.approve": { label: "Transfer Approved", color: "bg-green-100 text-green-700" },
  "transfer.reject": { label: "Transfer Rejected", color: "bg-red-100 text-red-700" },
};

function getActionDisplay(action: string) {
  return ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-700" };
}

export default function AuditLogsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (filterAction) params.set("action", filterAction);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [page, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Audit Log</h1>
        <p className="text-text-secondary text-sm mt-1">
          Track important actions performed across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white max-w-xs"
        >
          <option value="">All Actions</option>
          {data?.actions.map((a) => (
            <option key={a} value={a}>
              {getActionDisplay(a).label}
            </option>
          ))}
        </select>
        {data && (
          <span className="text-sm text-text-secondary self-center">
            {data.total} {data.total === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-surface-alt">
                    <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Action
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Details
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Performed By
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Group
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.logs.map((log) => {
                    const display = getActionDisplay(log.action);
                    return (
                      <tr key={log._id} className="hover:bg-surface-alt/50">
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${display.color}`}
                          >
                            {display.label}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-text max-w-[300px]">
                          {log.details}
                        </td>
                        <td className="p-4">
                          {log.performedBy ? (
                            <div>
                              <p className="text-sm font-medium text-text">
                                {log.performedBy.name}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {log.performedBy.role}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-text-secondary">
                              System
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-text-secondary">
                          {log.group?.name ?? "—"}
                        </td>
                        <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          <span className="text-xs">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "en-NG",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {(!data || data.logs.length === 0) && (
              <p className="p-8 text-center text-sm text-text-secondary">
                No audit log entries yet.
              </p>
            )}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-text-secondary">
                Page {data.page} of {data.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-alt disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (data?.pages ?? 1)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-alt disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
