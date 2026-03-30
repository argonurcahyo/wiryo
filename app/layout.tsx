import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* ── Top Navigation ── */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-emerald-600 hover:text-emerald-700"
            >
              🌳 Wiryo
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link href="/members" className="hover:text-zinc-900 dark:hover:text-zinc-50">
                Members
              </Link>
              {/* Add more nav items here */}
            </nav>
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="flex flex-1 flex-col">{children}</div>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          Wiryo Family Tree · Built with Next.js &amp; Turso
        </footer>

        {/* ── PWA service worker ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  if (${process.env.NODE_ENV === "production"}) {
                    // Production: register the SW for offline support
                    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
                  } else {
                    // Development: unregister any stale SW so it never intercepts HMR/router traffic
                    navigator.serviceWorker.getRegistrations().then(function (regs) {
                      regs.forEach(function (r) { r.unregister(); });
                    });
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
