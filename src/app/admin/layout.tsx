import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Admin dashboard
            </h1>
            <p className="text-xs text-slate-600">
              Manage users and outbreaks across all regions.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/admin/users"
              className="text-slate-700 hover:text-slate-900"
            >
              Users
            </Link>
            <Link
              href="/admin/facilities"
              className="text-slate-700 hover:text-slate-900"
            >
              Facilities
            </Link>
            <Link
              href="/admin/outbreaks"
              className="text-slate-700 hover:text-slate-900"
            >
              Outbreaks
            </Link>
            <form
              action="/api/auth/logout"
              method="post"
              className="inline-flex"
            >
              <button className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

