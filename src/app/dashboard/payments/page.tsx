"use client";

import { useEffect, useState, FormEvent } from "react";

interface Member {
  _id: string;
  stateCode: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
  amount: number;
  type: string;
}

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  shortCode?: string;
  note: string;
  member: { name: string; stateCode: string };
  category: { name: string; type: string; amount: number };
  recordedBy: { name: string };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [paymentsRes, membersRes, categoriesRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/members"),
      fetch("/api/categories"),
    ]);
    const [paymentsData, membersData, categoriesData] = await Promise.all([
      paymentsRes.json(),
      membersRes.json(),
      categoriesRes.json(),
    ]);
    setPayments(paymentsData);
    setMembers(membersData.filter((m: Member & { isActive: boolean }) => m.isActive));
    setCategories(categoriesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c._id === catId);
    if (cat) setAmount(cat.amount.toString());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member: memberId,
        category: categoryId,
        amount: Number(amount),
        date: date || undefined,
        note,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMemberId("");
    setCategoryId("");
    setAmount("");
    setDate("");
    setNote("");
    setShowForm(false);
    fetchData();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Payments</h1>
          <p className="text-text-secondary text-sm mt-1">
            Record and track member contributions
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Record Payment"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Record Payment
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
                  Member
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  required
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.stateCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({formatCurrency(c.amount)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Optional note"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Record Payment"}
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
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Member
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Category
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Amount
                </th>
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Method
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
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-surface-alt/50">
                  <td className="p-4">
                    <p className="text-sm font-medium text-text">
                      {payment.member.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {payment.member.stateCode}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-text">
                      {payment.category.name}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.method === "shortcode"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {payment.method === "shortcode"
                        ? `Code: ${payment.shortCode}`
                        : "Direct"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {new Date(payment.date).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {payment.recordedBy.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {payments.length === 0 && (
            <p className="p-8 text-center text-sm text-text-secondary">
              No payments recorded yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
