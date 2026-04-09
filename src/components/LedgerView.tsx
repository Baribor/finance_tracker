"use client";

import { useEffect, useState } from "react";

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  isAnonymous?: boolean;
  description?: string;
  member?: { name: string; stateCode: string };
  category?: { name: string };
  recordedBy: { name: string };
}

interface Expense {
  _id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  recordedBy: { name: string };
}

type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  by: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function LedgerView() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/payments").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([payments, expenses]: [Payment[], Expense[]]) => {
      const incomeEntries: LedgerEntry[] = payments.map((p) => ({
        id: p._id,
        date: p.date,
        description: p.isAnonymous
          ? p.description || "Anonymous payment"
          : `${p.member?.name ?? "Unknown"} - ${p.category?.name ?? "Uncategorized"}`,
        type: "income" as const,
        amount: p.amount,
        by: p.recordedBy?.name ?? "Unknown",
      }));

      const expenseEntries: LedgerEntry[] = expenses.map((e) => ({
        id: e._id,
        date: e.date,
        description: `${e.description} (${e.category})`,
        type: "expense" as const,
        amount: e.amount,
        by: e.recordedBy?.name ?? "Unknown",
      }));

      const all = [...incomeEntries, ...expenseEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEntries(all);
      setTotalIncome(incomeEntries.reduce((s, e) => s + e.amount, 0));
      setTotalExpense(expenseEntries.reduce((s, e) => s + e.amount, 0));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  let runningBalance = 0;
  const entriesWithBalance = [...entries].reverse().map((entry) => {
    if (entry.type === "income") {
      runningBalance += entry.amount;
    } else {
      runningBalance -= entry.amount;
    }
    return { ...entry, balance: runningBalance };
  });
  entriesWithBalance.reverse();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Financial Ledger</h1>
        <p className="text-text-secondary text-sm mt-1">
          Complete financial record of all transactions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
            Total Income
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
            Total Expenses
          </p>
          <p className="text-xl font-bold text-red-700 mt-1">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            Net Balance
          </p>
          <p className="text-xl font-bold text-blue-700 mt-1">
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Date
              </th>
              <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Description
              </th>
              <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Type
              </th>
              <th className="p-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Amount
              </th>
              <th className="p-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entriesWithBalance.map((entry) => (
              <tr key={entry.id} className="hover:bg-surface-alt/50">
                <td className="p-4 text-sm text-text-secondary">
                  {new Date(entry.date).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="p-4 text-sm text-text">{entry.description}</td>
                <td className="p-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.type === "income"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {entry.type === "income" ? "Income" : "Expense"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span
                    className={`text-sm font-semibold ${
                      entry.type === "income"
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {entry.type === "income" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                  </span>
                </td>
                <td className="p-4 text-right text-sm font-medium text-text">
                  {formatCurrency(entry.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {entries.length === 0 && (
          <p className="p-8 text-center text-sm text-text-secondary">
            No transactions yet.
          </p>
        )}
      </div>
    </div>
  );
}
