import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

import "@/styles/globals.css";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NeuroNotes",
  description: "AI second brain for students.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  }
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/notes", label: "Notes" },
  { href: "/chat", label: "Chat" },
  { href: "/analytics", label: "Analytics" }
] satisfies Array<{ href: Route; label: string }>;

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const stored = localStorage.getItem("neuronotes-theme");
                const theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
                document.documentElement.dataset.theme = theme;
              } catch {}
            })();`
          }}
        />
      </head>
      <body className="grid-bg">
        <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6">
          <header className="theme-header mb-8 border-[4px] border-ink bg-mint p-4 shadow-brutal">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href="/" className="flex items-center gap-3">
                  <div className="theme-logo-frame border-[3px] border-ink bg-white p-1 shadow-brutal-sm">
                    <Image
                      src="/logo.png"
                      alt="NeuroNotes logo"
                      width={52}
                      height={52}
                      className="h-12 w-12 object-cover"
                    />
                  </div>
                  <div>
                    <span className="block text-3xl font-black uppercase">
                      NeuroNotes
                    </span>
                    <span className="block text-sm font-bold uppercase">
                      AI second brain for serious study sessions
                    </span>
                  </div>
                </Link>
              </div>
              <div className="flex flex-col gap-4 md:items-end">
                <nav className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="theme-nav border-[3px] border-ink bg-white px-3 py-2 text-xs font-black uppercase text-ink shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center gap-3 text-xs font-black uppercase">
                  <ThemeToggle />
                  <span>{user?.email ?? "Guest mode"}</span>
                  {user ? <SignOutButton /> : null}
                </div>
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
