import Link from "next/link";
import { getAllMembers } from "@/lib/members";

export default async function Home() {
  // Fetch a quick count for the hero section
  let memberCount = 0;
  try {
    const members = await getAllMembers();
    memberCount = members.length;
  } catch {
    // DB not yet initialised (first visit) – safe to ignore here
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      {/* Hero */}
      <div className="max-w-2xl space-y-6">
        <div className="text-6xl">🌳</div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Welcome to <span className="text-emerald-600">Wiryo</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A private, multi-generation family tree — store, browse, and explore
          your ancestry across 5+ generations. Powered by Next.js &amp; Turso.
        </p>

        {/* Stats badge */}
        {memberCount > 0 && (
          <p className="inline-block rounded-full bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {memberCount} member{memberCount !== 1 ? "s" : ""} recorded
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/members"
            className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
          >
            View Family Tree →
          </Link>
          <Link
            href="/members?add=true"
            className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            + Add First Member
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="mt-20 grid max-w-3xl gap-6 sm:grid-cols-3">
        {[
          {
            icon: "🗂️",
            title: "Flat DB, Tree UI",
            desc: "Members stored in a flat SQLite table; tree built recursively in the browser.",
          },
          {
            icon: "🔗",
            title: "Multi-parent support",
            desc: "Each member can have an independent father & mother link.",
          },
          {
            icon: "📴",
            title: "Works Offline",
            desc: "PWA service worker caches the shell so the app opens without internet.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
              {f.title}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

