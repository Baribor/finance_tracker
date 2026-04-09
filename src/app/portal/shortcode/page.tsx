"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSession } from "next-auth/react";

interface Category {
  _id: string;
  name: string;
  amount: number;
  type: string;
}

interface ShortCodeData {
  _id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  category: { name: string; type: string; amount: number };
}

interface GeneratedCode {
  code: string;
  amount: number;
  expiresAt: string;
  categoryName: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PortalShortCodePage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [codes, setCodes] = useState<ShortCodeData[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const isCompleted = session?.user?.serviceStatus === "completed";

  const fetchData = async () => {
    const [catsRes, codesRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/shortcodes"),
    ]);
    const [catsData, codesData] = await Promise.all([
      catsRes.json(),
      codesRes.json(),
    ]);
    setCategories(catsData);
    setCodes(codesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setGenerated(null);
    setGenerating(true);

    const res = await fetch("/api/shortcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setGenerated(data);
    setCategoryId("");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/shortcodes?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) fetchData();
  };

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
        <h1 className="text-2xl font-bold text-text">Generate Payment Code</h1>

      {isCompleted && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 mt-4">
          <p className="text-sm text-orange-800">
            Short code generation is disabled because your service has been marked as completed.
          </p>
        </div>
      )}
        <p className="text-text-secondary text-sm mt-1">
          Generate a one-time code for a contribution, then present it to the
          secretary after making payment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isCompleted && (
        <div>
          <div className="bg-white rounded-xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-text mb-4">
              New Payment Code
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-danger text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Select Contribution
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {formatCurrency(c.amount)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={generating || !categoryId}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-all disabled:opacity-50 text-sm"
              >
                {generating ? "Generating..." : "Generate Code"}
              </button>
            </form>
          </div>

          {generated && (
            <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <p className="text-sm text-text-secondary mb-2">
                Your payment code for {generated.categoryName}
              </p>
              <div className="bg-white rounded-lg py-4 px-6 mb-3 border border-border">
                <span className="text-3xl font-mono font-bold text-primary tracking-[0.3em]">
                  {generated.code}
                </span>
              </div>
              <p className="text-sm font-medium text-text">
                {formatCurrency(generated.amount)}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Valid until{" "}
                {new Date(generated.expiresAt).toLocaleString("en-NG")} ·
                Present this code to the secretary after payment
              </p>
            </div>
          )}
        </div>
        )}

        <div>
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-text">
                Recent Codes
              </h2>
            </div>
            <div className="divide-y divide-border">
              {codes.length === 0 ? (
                <p className="p-5 text-sm text-text-secondary">
                  No codes generated yet
                </p>
              ) : (
                codes.map((sc) => (
                  <div key={sc._id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-text">
                        {sc.code}
                      </span>
                      <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sc.isUsed
                            ? "bg-green-100 text-green-700"
                            : new Date(sc.expiresAt) < new Date()
                            ? "bg-gray-100 text-gray-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {sc.isUsed
                          ? "Used"
                          : new Date(sc.expiresAt) < new Date()
                          ? "Expired"
                          : "Pending"}
                      </span>
                      {(sc.isUsed || new Date(sc.expiresAt) < new Date()) && (
                        <button
                          onClick={() => handleDelete(sc._id)}
                          disabled={deleting === sc._id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Delete code"
                        >
                          {deleting === sc._id ? "…" : "✕"}
                        </button>
                      )}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {sc.category.name} · {formatCurrency(sc.amount)} ·{" "}
                      {new Date(sc.createdAt).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
