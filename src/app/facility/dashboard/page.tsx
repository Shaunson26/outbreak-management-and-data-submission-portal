import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function FacilityDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "FACILITY" || !user.facilityId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">
          You must be signed in as a facility user to view this page.
        </p>
      </div>
    );
  }

  const outbreaks = await prisma.outbreak.findMany({
    where: { facilityId: user.facilityId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Facility dashboard
            </h1>
            <p className="text-xs text-slate-600">
              {user.facility?.name} · {user.facility?.region}
            </p>
          </div>
          <form
            action="/api/auth/logout"
            method="post"
            className="inline-flex"
          >
            <button className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Outbreaks
          </h2>
          <Link
            href="/facility/outbreaks/new"
            className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
          >
            New outbreak
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Disease</th>
                <th className="px-4 py-3">Onset date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Cases</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {outbreaks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No outbreaks recorded yet.
                  </td>
                </tr>
              ) : (
                outbreaks.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-900">{o.disease}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(o.onsetDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {o.caseCount}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/facility/outbreaks/${o.id}`}
                        className="text-xs font-medium text-sky-600 hover:text-sky-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

