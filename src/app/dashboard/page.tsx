"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  memberCount: number;
  categoryCount: number;
  recentPayments: Array<{
    _id: string;
    amount: number;
    date: string;
    member: { name: string; stateCode: string } | null;
    category: { name: string } | null;
    isAnonymous?: boolean;
    description?: string;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/groups/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dashData, grpData]) => {
        setData(dashData);
        if (grpData?.name) setGroupName(grpData.name);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
        <p className="text-xs text-text-secondary">Loading dashboard...</p>
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
      label: "Active Members",
      value: data.memberCount.toString(),
      icon: "👥",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "Categories",
      value: data.categoryCount.toString(),
      icon: "📁",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">
              Financial overview at a glance
            </p>
          </div>
          {groupName && (
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary leading-none">CDS Group</p>
                <p className="text-sm font-semibold text-primary">{groupName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${stat.color}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">
              Recent Payments
            </h2>
            <span className="text-xs text-text-secondary">{data.recentPayments.length} latest</span>
          </div>
          <div className="divide-y divide-border">
            {data.recentPayments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-text-secondary">
                  No payments recorded yet
                </p>
              </div>
            ) : (
              data.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {payment.isAnonymous ? (payment.description || "Anonymous") : (payment.member?.name ?? "Unknown")}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {payment.isAnonymous ? "Anonymous" : (payment.category?.name ?? "Uncategorized")} · {formatDate(payment.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">
              Recent Expenses
            </h2>
            <span className="text-xs text-text-secondary">{data.recentExpenses.length} latest</span>
          </div>
          <div className="divide-y divide-border">
            {data.recentExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-text-secondary">
                  No expenses recorded yet
                </p>
              </div>
            ) : (
              data.recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="p-4 flex items-center justify-between hover:bg-surface-alt transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {expense.description}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {expense.category} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-danger">
                    -{formatCurrency(expense.amount)}
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
