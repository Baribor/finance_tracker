"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface MemberInfo {
  _id: string;
  stateCode: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface GroupDetail {
  group: { _id: string; name: string; description: string; isActive: boolean };
  members: MemberInfo[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  recentPayments: Array<{
    _id: string;
    amount: number;
    date: string;
    member: { name: string; stateCode: string };
    category: { name: string };
  }>;
  recentExpenses: Array<{
    _id: string;
    amount: number;
    date: string;
    description: string;
    category: string;
    recordedBy: { name: string };
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/groups/${id}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Total Income",
      value: formatCurrency(data.totalIncome),
      icon: "💰",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(data.totalExpenses),
      icon: "📤",
      color: "bg-red-50 text-red-700 border-red-200",
    },
    {
      label: "Balance",
      value: formatCurrency(data.balance),
      icon: "🏦",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Members",
      value: data.members.filter((m) => m.role === "member").length.toString(),
      icon: "👥",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/groups"
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          &larr; Back to Groups
        </Link>
        <h1 className="text-2xl font-bold text-text">{data.group.name}</h1>
        {data.group.description && (
          <p className="text-text-secondary text-sm mt-1">
            {data.group.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-5 ${stat.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.members.map((member) => (
                <tr key={member._id} className="hover:bg-surface-alt/50">
                  <td className="p-4 font-mono text-sm font-medium text-text">
                    {member.stateCode}
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
                      />
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Recent Payments
            </h2>
          </div>
          <div className="divide-y divide-border">
            {data.recentPayments.length === 0 ? (
              <p className="p-5 text-sm text-text-secondary">
                No payments recorded yet
              </p>
            ) : (
              data.recentPayments.map((p) => (
                <div
                  key={p._id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {p.member?.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {p.category?.name} &middot; {formatDate(p.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    +{formatCurrency(p.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-text">
              Recent Expenses
            </h2>
          </div>
          <div className="divide-y divide-border">
            {data.recentExpenses.length === 0 ? (
              <p className="p-5 text-sm text-text-secondary">
                No expenses recorded yet
              </p>
            ) : (
              data.recentExpenses.map((e) => (
                <div
                  key={e._id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {e.description}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {e.category} &middot; {formatDate(e.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-danger">
                    -{formatCurrency(e.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
