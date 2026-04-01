import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Link from "next/link";
import ServiceWorkerInit from "@/components/ServiceWorkerInit";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Wiryo – Family Tree", template: "%s | Wiryo" },
  description: "A multi-generation family tree app built with Next.js & Turso.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Wiryo" },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("wiryo-theme")?.value;
  const isDark = theme === "dark";

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* ── Top Navigation ── */}
        <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/75 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            {/* Brand */}
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-base leading-none shadow-sm transition-colors group-hover:bg-emerald-600">
                🌳
              </span>
              <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Wiryo
              </span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Tree
              </Link>
              <Link
                href="/members"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                Members
              </Link>
              <div className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
              <ThemeToggle />
            </nav>
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="flex flex-1 flex-col">{children}</div>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Wiryo</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-zinc-500 dark:text-zinc-500">Silsilah Keluarga</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Built with Next.js &amp; Turso &nbsp;·&nbsp; {new Date().getFullYear()}
            </p>
          </div>
        </footer>

        {/* ── PWA service worker ── */}
        <ServiceWorkerInit />
      </body>
    </html>
  );
}
