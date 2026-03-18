"use client";

import { useState } from "react";

export default function AdminPhuUsersPage() {
  const [adminToken, setAdminToken] = useState("");
  const [phuName, setPhuName] = useState("");
  const [region, setRegion] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/phu-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({
          phuName,
          region,
          notificationEmail: notificationEmail || undefined,
          userEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setResult(
        `Created PHU "${data.phuName}" (id=${data.phuId}) and user ${data.userEmail} (id=${data.userId}).`,
      );
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">
            Admin – PHU user management
          </h1>
          <p className="text-sm text-slate-600">
            Use this panel to create public health unit (PHU) users linked to a
            PHU and region. This is a proof-of-concept admin tool; protect
            access appropriately.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-white p-6 border border-slate-200 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Admin token
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="Value of ADMIN_TOKEN from server"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                PHU name
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={phuName}
                onChange={(e) => setPhuName(e.target.value)}
                placeholder="e.g. Metro North Public Health Unit"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Region
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Metro North"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              PHU notification email (optional)
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="phu-notifications@example.org"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                PHU user email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="phu.user@example.org"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                PHU user password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {result && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
              {result}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Creating PHU user..." : "Create PHU user"}
          </button>
        </form>

        <div className="text-xs text-slate-500 space-y-1">
          <p>
            This admin panel calls the backend{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">
              POST /api/admin/phu-users
            </code>{" "}
            endpoint with the admin token you enter above.
          </p>
          <p>
            For production, you would typically protect this route behind VPN,
            IP allowlists, or proper admin authentication.
          </p>
        </div>
      </main>
    </div>
  );
}

