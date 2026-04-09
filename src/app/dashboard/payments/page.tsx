"use client";

import { useEffect, useState, FormEvent, useRef } from "react";

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
  isAnonymous?: boolean;
  description?: string;
  member?: { name: string; stateCode: string };
  category?: { name: string; type: string; amount: number };
  recordedBy: { name: string } | null;
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.stateCode.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target as Node)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    if (!isAnonymous && !memberId) {
      setError("Please select a member from the dropdown");
      return;
    }
    setSubmitting(true);

    const payload = isAnonymous
      ? {
          isAnonymous: true,
          description,
          amount: Number(amount),
          date: date || undefined,
          note,
        }
      : {
          member: memberId,
          category: categoryId,
          amount: Number(amount),
          date: date || undefined,
          note,
        };

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setIsAnonymous(false);
    setMemberId("");
    setMemberSearch("");
    setCategoryId("");
    setAmount("");
    setDate("");
    setNote("");
    setDescription("");
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

            {/* Anonymous toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAnonymous(!isAnonymous);
                  setMemberId("");
                  setMemberSearch("");
                  setCategoryId("");
                  setDescription("");
                  setAmount("");
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnonymous ? "bg-primary" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnonymous ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-text">
                Anonymous Payment
              </span>
              <span className="text-xs text-text-secondary">
                (donations, starting balance, etc.)
              </span>
            </div>

            {isAnonymous ? (
              /* Anonymous payment fields */
              <>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="e.g. Anonymous donation, Starting balance, Fundraiser proceeds"
                    required
                  />
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
              </>
            ) : (
              /* Regular member payment fields */
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div ref={memberDropdownRef} className="relative">
                <label className="block text-sm font-medium text-text mb-1.5">
                  Member
                </label>
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberId("");
                    setShowMemberDropdown(true);
                  }}
                  onFocus={() => setShowMemberDropdown(true)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  placeholder="Type to search members..."
                  required={!memberId}
                  autoComplete="off"
                />
                {memberId && (
                  <input type="hidden" name="memberId" value={memberId} />
                )}
                {showMemberDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="px-4 py-2.5 text-sm text-text-secondary">
                        No members found
                      </div>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => {
                            setMemberId(m._id);
                            setMemberSearch(`${m.name} (${m.stateCode})`);
                            setShowMemberDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-alt transition-colors ${
                            memberId === m._id ? "bg-primary/5 text-primary font-medium" : "text-text"
                          }`}
                        >
                          {m.name}{" "}
                          <span className="text-text-secondary">
                            ({m.stateCode})
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
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
              </>
            )}
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
                    {payment.isAnonymous ? (
                      <div>
                        <p className="text-sm font-medium text-amber-700">
                          Anonymous
                        </p>
                        <p className="text-xs text-text-secondary">
                          {payment.description}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-text">
                          {payment.member?.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {payment.member?.stateCode}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-text">
                      {payment.isAnonymous ? "—" : payment.category?.name}
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
                    {payment.recordedBy?.name ?? "Unknown"}
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
