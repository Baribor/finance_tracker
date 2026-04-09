"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  shortCode?: string;
  note: string;
  member?: { name: string; stateCode: string };
  recordedBy: { name: string } | null;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  amount: number;
  type: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/categories/${categoryId}/payments`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCategory(data.category);
    setPayments(data.payments);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.member?.name.toLowerCase().includes(q) ||
      p.member?.stateCode.toLowerCase().includes(q)
    );
  });

  const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);

  const handleDownload = () => {
    const rows = filtered.map((p) => ({
      Name: p.member?.name ?? "Unknown",
      "State Code": p.member?.stateCode ?? "",
      Amount: p.amount,
      Method: p.method === "shortcode" ? `Code: ${p.shortCode}` : "Direct",
      Date: new Date(p.date).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      "Recorded By": p.recordedBy?.name ?? "Unknown",
      Note: p.note || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)
      ),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(
      wb,
      `${category?.name ?? "Category"}_Payments.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Category not found.</p>
        <button
          onClick={() => router.push("/dashboard/categories")}
          className="mt-4 text-primary text-sm hover:underline"
        >
          Back to Categories
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/categories")}
          className="text-sm text-text-secondary hover:text-primary transition-colors mb-3 inline-flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Categories
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">{category.name}</h1>
            <p className="text-text-secondary text-sm mt-1">
              {category.description || "Payment history"} &middot;{" "}
              <span className="font-medium">{formatCurrency(category.amount)}</span> per payment &middot;{" "}
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  category.type === "monthly"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {category.type === "monthly" ? "Monthly" : "Levy"}
              </span>
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={filtered.length === 0}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 self-start inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download XLSX
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Total Payments
          </p>
          <p className="text-xl font-bold text-text mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Total Amount
          </p>
          <p className="text-xl font-bold text-success mt-1">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Unique Members
          </p>
          <p className="text-xl font-bold text-text mt-1">
            {new Set(filtered.map((p) => p.member?.stateCode).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by member name or state code..."
          className="w-full max-w-md px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        />
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Member
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
                <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((payment) => (
                <tr key={payment._id} className="hover:bg-surface-alt/50">
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {payment.member?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {payment.member?.stateCode}
                      </p>
                    </div>
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
                    {payment.recordedBy?.name ?? "Unknown"}
                  </td>
                  <td className="p-4 text-sm text-text-secondary max-w-[150px] truncate">
                    {payment.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-text-secondary">
            {search
              ? "No payments match your search."
              : "No payments recorded for this category yet."}
          </p>
        )}
      </div>
    </div>
  );
}
