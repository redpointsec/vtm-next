import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTM Next",
  description: "A Next.js intentionally vulnerable task manager.",
};

const navItems = [
  ["Dashboard", "/dashboard"],
  ["Projects", "/projects"],
  ["Tasks", "/tasks"],
  ["AI Assistant", "/chat"],
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              <form className="top-search" action="/dashboard">
                <input name="q" placeholder="Search training data" />
              </form>
              <Link className="user-chip" href="/login">
                chris
              </Link>
            </header>
            <section className="content">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
