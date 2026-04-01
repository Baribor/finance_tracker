import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Logged-in users go straight to their area
  if (session) {
    if (session.user.role === "admin") redirect("/admin");
    if (session.user.role === "secretary") redirect("/dashboard");
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50">
      {/* Nav */}
      <header className="border-b border-border bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow">
              <span className="text-white text-sm font-bold">₦</span>
            </div>
            <span className="font-bold text-text text-lg">CDS Finance Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
            >
              Register Group
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-100 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          NYSC CDS Financial Management
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-6">
          Track your CDS group<br />
          <span className="text-primary">finances with ease</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto mb-10">
          A dedicated platform for NYSC Community Development Service groups
          to manage contributions, levies, expenses, and member records — all
          in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-dark transition-colors shadow-md text-sm"
          >
            Register your CDS Group →
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text border border-border bg-white px-8 py-3.5 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: "💰",
              title: "Contribution Tracking",
              desc: "Record monthly dues and levies. Members see their own payment status in real time.",
            },
            {
              icon: "📊",
              title: "Financial Ledger",
              desc: "Full income and expense ledger with balance calculations, visible to all members.",
            },
            {
              icon: "🔑",
              title: "Secure Short Codes",
              desc: "Members generate one-time payment codes so secretaries can verify contributions instantly.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-border shadow-sm p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-text mb-1">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-2xl font-bold text-text text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Register your group",
                desc: "Fill in your CDS group details and your personal state code. Submit for admin review.",
              },
              {
                step: "2",
                title: "Admin approves",
                desc: "The platform admin reviews your request and, on approval, activates your group and secretary account.",
              },
              {
                step: "3",
                title: "Start managing",
                desc: "Sign in with your state code, add members, create categories, and start recording payments.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-9 h-9 shrink-0 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{s.title}</h3>
                  <p className="text-sm text-text-secondary">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-text-secondary py-8">
        CDS Finance Tracker &mdash; Built for NYSC corp members
      </footer>
    </div>
  );
}

