import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTrainingUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTM Next",
  description: "A Next.js intentionally vulnerable task manager.",
};

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Projects", "/projects"],
  ["Tasks", "/tasks"],
  ["Search", "/search"],
  ["Ping", "/ping"],
  ["Debug", "/debug"],
  ["API Docs", "/docs"],
  ["AI Assistant", "/chat"],
  ["Register", "/register"],
  ["Forgot Password", "/forgot-password"],
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentTrainingUser();

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/dashboard">
              VTM<span>Next</span>
            </Link>
            <nav aria-label="Primary navigation">
              {navItems.map(([label, href]) => (
                <Link key={href} className="nav-link" href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="main-panel">
            <header className="topbar">
              <form className="top-search" action="/search">
                <input name="q" placeholder="Search training data" />
              </form>
              <div className="top-actions">
                <Link className="user-chip" href={`/profile/${currentUser?.id || 2}`}>
                  {currentUser?.username || "chris"}
                </Link>
                <Link className="button secondary compact" href="/api/auth/logout?redirect=/login">
                  Logout
                </Link>
              </div>
            </header>
            <section className="content">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
