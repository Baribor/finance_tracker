"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const serviceExpired =
    session?.user?.serviceStatus === "completed" &&
    session?.user?.serviceCompletedAt &&
    Date.now() - new Date(session.user.serviceCompletedAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session?.user?.role === "secretary") {
        router.push("/dashboard");
      } else if (session?.user?.role === "admin") {
        router.push("/admin");
      } else if (session?.user?.mustChangePassword) {
        router.push("/change-password");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
        <p className="text-xs text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!session || session.user.role === "secretary" || session.user.role === "admin") return null;

  if (serviceExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-text mb-2">Access Expired</h1>
          <p className="text-sm text-text-secondary mb-6">
            Your service has been marked as completed and the 30-day access
            period has ended. You can no longer access the member portal.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-4 pt-18 lg:pt-8 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
