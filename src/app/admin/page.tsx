"use client";

import { useEffect, useState } from "react";

interface AdminDashboardData {
  groupCount: number;
  totalMembers: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

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
      label: "CDS Groups",
      value: data.groupCount.toString(),
      icon: "🏢",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "Total Members",
      value: data.totalMembers.toString(),
      icon: "👥",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
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
      label: "Net Balance",
      value: formatCurrency(data.balance),
      icon: "🏦",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Admin Overview</h1>
        <p className="text-text-secondary text-sm mt-1">
          Platform-wide financial summary across all CDS groups
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
    </div>
  );
}
