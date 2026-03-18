import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PhuStatusForm } from "./PhuStatusForm";

type PageParams = {
  id: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export default async function PhuOutbreakDetailPage(props: PageProps) {
  const params = await props.params;
  const user = await getCurrentUser();

  const isAdmin = user?.role === "ADMIN";

  if (!user || (user.role !== "PHU" && !isAdmin) || (!user.phuId && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">
          You must be signed in as a public health unit user or admin to view
          this page.
        </p>
      </div>
    );
  }

  const outbreakId = Number(params.id);
  if (!Number.isFinite(outbreakId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Invalid outbreak id.</p>
      </div>
    );
  }

  const outbreak = await prisma.outbreak.findFirst({
    where: isAdmin
      ? {
          id: outbreakId,
        }
      : {
          id: outbreakId,
          facility: {
            region: {
              equals: (
                await prisma.publicHealthUnit.findUnique({
                  where: { id: user.phuId! },
                  select: { region: true },
                })
              )?.region,
            },
          },
        },
    include: {
      facility: true,
      lineListEntries: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: true,
        },
      },
    },
  });

  if (!outbreak) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Outbreak not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {outbreak.disease} outbreak
            </h1>
            <p className="text-xs text-slate-600">
              {outbreak.facility.name} · {outbreak.facility.region} ·{" "}
              {outbreak.facility.type}
            </p>
          </div>
          <a
            href={isAdmin ? "/admin/outbreaks" : "/phu/dashboard"}
            className="text-xs text-sky-600 hover:text-sky-700"
          >
            {isAdmin ? "Back to dashboard" : "Back to dashboard"}
          </a>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </h2>
            <p className="text-sm text-slate-700">
              Facility:{" "}
              <span className="font-medium">{outbreak.facility.name}</span>
            </p>
            <p className="text-sm text-slate-700">
              Region:{" "}
              <span className="font-medium">{outbreak.facility.region}</span>
            </p>
            <p className="text-sm text-slate-700">
              Earliest onset:{" "}
              <span className="font-medium">
                {new Date(outbreak.onsetDate).toLocaleDateString()}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Status:{" "}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {outbreak.status}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Total cases:{" "}
              <span className="font-semibold">{outbreak.caseCount}</span>
            </p>
            <p className="text-sm text-slate-700">
              Staff:{" "}
              <span className="font-semibold">
                {outbreak.staffCaseCount}
              </span>
              , Residents/children:{" "}
              <span className="font-semibold">
                {outbreak.residentCaseCount}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Threshold met:{" "}
              <span
                className={
                  outbreak.isAboveThreshold
                    ? "text-emerald-700 font-semibold"
                    : "text-slate-700"
                }
              >
                {outbreak.isAboveThreshold ? "Yes" : "No"}
              </span>
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status actions
            </h2>
            <p className="text-xs text-slate-600">
              Change status and record a short note. This will be logged in the
              outbreak audit trail.
            </p>
            <PhuStatusForm
              outbreakId={outbreak.id}
              currentStatus={outbreak.status}
            />
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent activity
            </h2>
            {outbreak.auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No audit entries yet.</p>
            ) : (
              <ul className="space-y-1 max-h-60 overflow-y-auto text-xs">
                {outbreak.auditLogs.map((log) => (
                  <li key={log.id} className="text-slate-700">
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()} ·{" "}
                      {log.user?.email ?? "system"}
                    </span>
                    <br />
                    <span className="font-semibold">{log.action}</span>
                    {log.details && (
                      <>
                        {": "}
                        <span>{log.details}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Line list ({outbreak.lineListEntries.length})
            </h2>
          </div>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Person</th>
                <th className="px-4 py-2">Age group</th>
                <th className="px-4 py-2">Onset date</th>
                <th className="px-4 py-2">Symptoms</th>
                <th className="px-4 py-2">Hospitalised</th>
                <th className="px-4 py-2">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outbreak.lineListEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-4 text-center text-xs text-slate-500"
                  >
                    No people added yet.
                  </td>
                </tr>
              ) : (
                outbreak.lineListEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-900">
                      {entry.name ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-slate-900">
                      {entry.personType}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.ageGroup ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {new Date(entry.symptomOnsetDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.symptoms ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.hospitalised ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {entry.outcome ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
