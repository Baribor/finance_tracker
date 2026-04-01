"use client";

import { useState, FormEvent } from "react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

interface ValidationResult {
  payment: {
    _id: string;
    amount: number;
    member: { name: string; stateCode: string };
    category: { name: string };
  };
  message: string;
}

export default function ShortCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/shortcodes/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setResult(data);
    setCode("");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Short Code Validation</h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter the payment code provided by a member to validate and record
          their payment
        </p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-border shadow-sm p-6">
          <form onSubmit={handleValidate} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Payment Short Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg font-mono tracking-widest text-center uppercase"
                placeholder="ENTER CODE"
                maxLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length === 0}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark focus:outline-none transition-all disabled:opacity-50 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Validating...
                </span>
              ) : (
                "Validate & Record Payment"
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✅</span>
              <h3 className="text-lg font-semibold text-green-800">
                Payment Recorded!
              </h3>
            </div>
            <p className="text-sm text-green-700 mb-3">{result.message}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Member:</span>
                <span className="font-medium text-green-800">
                  {result.payment.member.name} (
                  {result.payment.member.stateCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Category:</span>
                <span className="font-medium text-green-800">
                  {result.payment.category.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Amount:</span>
                <span className="font-medium text-green-800">
                  {formatCurrency(result.payment.amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
