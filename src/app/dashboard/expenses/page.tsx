"use client";

import { useEffect, useState, FormEvent } from "react";

interface Expense {
  _id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  recordedBy: { name: string } | null;
  createdAt: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

const expenseCategories = [
  "Transportation",
  "Materials & Supplies",
  "Event/Program",
  "Utilities",
  "Donations",
  "Miscellaneous",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: Number(amount),
        date: date || undefined,
        category,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setDescription("");
    setAmount("");
    setDate("");
    setCategory("");
    setShowForm(false);
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Expenses</h1>
          <p className="text-text-secondary text-sm mt-1">
            Track group expenditures · Total:{" "}
            <span className="font-semibold text-danger">
              {formatCurrency(totalExpenses)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Log Expense"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Log New Expense
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
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="What was the expense for?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  required
                >
                  <option value="">Select category</option>
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Logging..." : "Log Expense"}
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
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Description
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Category
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Amount
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Date
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-surface-alt/50">
                  <td className="p-4 text-sm text-text">
                    {expense.description}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold text-danger">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {new Date(expense.date).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {expense.recordedBy?.name ?? "Unknown"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {expenses.length === 0 && (
            <p className="p-8 text-center text-sm text-text-secondary">
              No expenses logged yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
