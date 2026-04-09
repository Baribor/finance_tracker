"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "secretary") {
        router.push("/portal");
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

  if (!session || session.user.role !== "secretary") return null;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-4 pt-18 lg:pt-8 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
