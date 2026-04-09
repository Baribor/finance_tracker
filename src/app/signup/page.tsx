"use client";

import Link from "next/link";
import { useState, useMemo, FormEvent } from "react";
import { nigeriaStates } from "@/lib/nigeria-states";
import ChatWidget from "@/components/ChatWidget";

export default function SignupPage() {
  // Group details
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  // Secretary personal details
  const [secretaryName, setSecretaryName] = useState("");
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [secretaryStateCode, setSecretaryStateCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const lgaOptions = useMemo(() => {
    if (!state) return [];
    return nigeriaStates.find((s) => s.state === state)?.lgas ?? [];
  }, [state]);

  const handleStateChange = (val: string) => {
    setState(val);
    setLga("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupName: groupName.trim(),
        groupDescription: groupDescription.trim(),
        lga: lga.trim(),
        state: state.trim(),
        secretaryName: secretaryName.trim(),
        secretaryEmail: secretaryEmail.trim(),
        secretaryStateCode: secretaryStateCode.trim(),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 p-4">
        <div className="bg-white rounded-2xl border border-border shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Request Submitted!</h2>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Your CDS group registration request has been received. An admin will
            review it and activate your account. You&apos;ll receive an email
            notification once it&apos;s approved.
          </p>
          <Link
            href="/login"
            className="inline-block bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const selectClass =
    "w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white appearance-none";
  const inputClass =
    "w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-sm font-bold">₦</span>
            </div>
            <span className="font-bold text-text text-lg">CDS Finance Tracker</span>
          </Link>
          <h1 className="text-2xl font-bold text-text">Register your CDS Group</h1>
          <p className="text-text-secondary text-sm mt-1.5 max-w-sm mx-auto">
            Submit your details for admin review. Your group and account will be activated on approval.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-danger text-sm p-3.5 rounded-lg border border-red-200 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* CDS Group Info */}
            <div>
              <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                CDS Group Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    CDS Group Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Health & Sanitation CDS"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-none`}
                    placeholder="Brief description of your CDS group (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      State <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className={selectClass}
                        required
                      >
                        <option value="">Select state</option>
                        {nigeriaStates.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      LGA <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={lga}
                        onChange={(e) => setLga(e.target.value)}
                        className={selectClass}
                        required
                        disabled={!state}
                      >
                        <option value="">
                          {state ? "Select LGA" : "Select state first"}
                        </option>
                        {lgaOptions.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Secretary Info */}
            <div>
              <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Your Details (Secretary)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={secretaryName}
                    onChange={(e) => setSecretaryName(e.target.value)}
                    className={inputClass}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    value={secretaryEmail}
                    onChange={(e) => setSecretaryEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    You will receive approval or rejection updates at this address.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    State Code <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={secretaryStateCode}
                    onChange={(e) =>
                      setSecretaryStateCode(e.target.value.toUpperCase())
                    }
                    className={`${inputClass} font-mono`}
                    placeholder="e.g. AB/23C/0001"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    This will be your login ID and your default password after approval.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Submitting...
                </span>
              ) : (
                "Submit Registration Request"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <ChatWidget />
    </div>
  );
}
