import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function PhuDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "PHU" || !user.phuId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">
          You must be signed in as a public health unit user to view this page.
        </p>
      </div>
    );
  }

  const phu = await prisma.publicHealthUnit.findUnique({
    where: { id: user.phuId },
  });

  if (!phu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Public health unit not found.</p>
      </div>
    );
  }

  const outbreaks = await prisma.outbreak.findMany({
    where: {
      facility: {
        region: phu.region,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      facility: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              PHU dashboard
            </h1>
            <p className="text-xs text-slate-600">
              {phu.name} · Region: {phu.region}
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

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Outbreaks in your region
          </h2>
          <p className="text-xs text-slate-600">
            Showing facilities where region = {phu.region}
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Disease</th>
                <th className="px-4 py-3">Onset</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Cases</th>
                <th className="px-4 py-3 text-right">Above threshold</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {outbreaks.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No outbreaks have been reported for this region yet.
                  </td>
                </tr>
              ) : (
                outbreaks.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-900">
                      {o.facility.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.facility.region}
                    </td>
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
                      <span
                        className={
                          o.isAboveThreshold
                            ? "text-emerald-700 text-xs font-semibold"
                            : "text-slate-500 text-xs"
                        }
                      >
                        {o.isAboveThreshold ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/phu/outbreaks/${o.id}`}
                        className="text-xs font-medium text-sky-600 hover:text-sky-700"
                      >
                        Review
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

