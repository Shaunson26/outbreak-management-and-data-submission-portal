import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminFacilitiesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">
          You must be signed in as an admin user to view this page.
        </p>
      </div>
    );
  }

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
    include: {
      users: true,
      outbreaks: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Facilities
        </h2>
        <p className="text-xs text-slate-600">
          All facilities with their users and outbreak counts.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3 text-right">Users</th>
              <th className="px-4 py-3 text-right">Outbreaks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {facilities.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No facilities found.
                </td>
              </tr>
            ) : (
              facilities.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-3 text-slate-900">{f.name}</td>
                  <td className="px-4 py-3 text-slate-700">{f.type}</td>
                  <td className="px-4 py-3 text-slate-700">{f.region}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs">
                    <span className="line-clamp-2">{f.address}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold">
                        {f.users.length}
                      </span>{" "}
                      user{f.users.length === 1 ? "" : "s"}
                    </div>
                    {f.users.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                        {f.users.slice(0, 3).map((u) => (
                          <li key={u.id}>
                            {u.email}{" "}
                            <span className="uppercase tracking-wide text-[10px] text-slate-500">
                              ({u.role})
                            </span>
                          </li>
                        ))}
                        {f.users.length > 3 && (
                          <li className="text-[10px] text-slate-500">
                            +{f.users.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold">
                        {f.outbreaks.length}
                      </span>{" "}
                      outbreak{f.outbreaks.length === 1 ? "" : "s"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

