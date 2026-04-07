"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  category: { name: string; type: string; amount: number };
}

interface Category {
  _id: string;
  name: string;
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

export default function PortalPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isCompleted = session?.user?.serviceStatus === "completed";

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchAll = async () => {
      const [paymentsRes, categoriesRes, groupRes] = await Promise.all([
        fetch(`/api/payments?memberId=${session.user.id}`),
        fetch("/api/categories"),
        fetch("/api/groups/me"),
      ]);

      const [paymentsData, categoriesData, groupData] = await Promise.all([
        paymentsRes.json(),
        categoriesRes.json(),
        groupRes.ok ? groupRes.json() : null,
      ]);

      setPayments(paymentsData);
      setCategories(categoriesData);
      if (groupData && groupData.name) setGroupName(groupData.name);
      setLoading(false);
    };

    fetchAll();
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
        <p className="text-xs text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate payment status per category
  const statusByCategory = categories.map((cat) => {
    const catPayments = payments.filter(
      (p) => p.category?.name === cat.name
    );
    const paid = catPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...cat,
      paid,
      remaining: Math.max(0, cat.amount - paid),
      status: paid >= cat.amount ? "paid" : paid > 0 ? "partial" : "unpaid",
    };
  });

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">
              Welcome back, {session?.user?.name}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Your payment overview and contribution status
            </p>
          </div>
        </div>
        {groupName && (
          <div className="mt-4 inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
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

      {isCompleted && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">
                Service Completed
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Your service has been marked as completed. You have read-only
                access to your historical financial records. Active contributions
                and short code generation are disabled. Portal access will expire
                30 days after completion.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 transition-shadow hover:shadow-md">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
            Total Paid
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 transition-shadow hover:shadow-md">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            Payments Made
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {payments.length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 transition-shadow hover:shadow-md">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">
            Active Categories
          </p>
          <p className="text-2xl font-bold text-purple-700 mt-2">
            {categories.length}
          </p>
        </div>
      </div>

      {!isCompleted && (
        <>
      <h2 className="text-lg font-semibold text-text mb-4">
        Contribution Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statusByCategory.map((cat) => (
          <div
            key={cat._id}
            className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-text">{cat.name}</h3>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  cat.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : cat.status === "partial"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {cat.status === "paid"
                  ? "Paid"
                  : cat.status === "partial"
                  ? "Partial"
                  : "Unpaid"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Required:</span>
                <span className="font-medium text-text">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Paid:</span>
                <span className="font-medium text-success">
                  {formatCurrency(cat.paid)}
                </span>
              </div>
              {cat.remaining > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Remaining:</span>
                  <span className="font-medium text-danger">
                    {formatCurrency(cat.remaining)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  cat.status === "paid"
                    ? "bg-green-500"
                    : cat.status === "partial"
                    ? "bg-amber-500"
                    : "bg-gray-300"
                }`}
                style={{
                  width: `${Math.min(100, (cat.paid / cat.amount) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
        {statusByCategory.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-text-secondary bg-white rounded-xl border border-border">
            No active contribution categories yet.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
