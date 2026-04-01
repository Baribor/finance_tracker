"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Payment {
  _id: string;
  amount: number;
  date: string;
  method: string;
  shortCode?: string;
  note: string;
  category: { name: string; type: string };
  recordedBy: { name: string };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PortalPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/payments?memberId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data);
        setLoading(false);
      });
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">My Payments</h1>
        <p className="text-text-secondary text-sm mt-1">
          Your complete payment history
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
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
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-surface-alt/50">
                <td className="p-4">
                  <span className="text-sm font-medium text-text">
                    {payment.category.name}
                  </span>
                  <span
                    className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs ${
                      payment.category.type === "monthly"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {payment.category.type}
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
                    {payment.method === "shortcode" ? "Short Code" : "Direct"}
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
                  {payment.note || "—"}
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
    </div>
  );
}
