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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
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
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Financial overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
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
              data.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {payment.member.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {payment.category.name} · {formatDate(payment.date)}
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
              data.recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {expense.description}
                    </p>
                    <p className="text-xs text-text-secondary">
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
