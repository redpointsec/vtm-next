import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTrainingUser } from "@/lib/auth";
import { isAuthRoute, isPublicRoute } from "@/lib/route-policy";
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
  const headerStore = await headers();
  const pathname = headerStore.get("x-vtm-pathname") || "/";
  const currentUser = await getCurrentTrainingUser();
  const authRoute = isAuthRoute(pathname);
  const publicRoute = isPublicRoute(pathname);

  if (!currentUser && !publicRoute) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (!currentUser && authRoute) {
    return (
      <html lang="en">
        <body>
          <main className="auth-shell">{children}</main>
        </body>
      </html>
    );
  }

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
                {currentUser ? (
                  <>
                    <Link className="user-chip" href={`/profile/${currentUser.id}`}>
                      {currentUser.username}
                    </Link>
                    <Link className="button secondary compact" href="/api/auth/logout?redirect=/login">
                      Logout
                    </Link>
                  </>
                ) : (
                  <Link className="button secondary compact" href="/login">
                    Login
                  </Link>
                )}
              </div>
            </header>
            <section className="content">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
