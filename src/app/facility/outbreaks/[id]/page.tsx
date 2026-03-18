import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AddLineListEntryForm } from "./AddLineListEntryForm";
import { LineListTable } from "./LineListTable";
import { UploadLineListForm } from "./UploadLineListForm";

type PageParams = {
  id: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export default async function OutbreakDetailPage(props: PageProps) {
  const params = await props.params;
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

  const outbreakId = Number(params.id);
  if (!Number.isFinite(outbreakId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Invalid outbreak id.</p>
      </div>
    );
  }

  const outbreak = await prisma.outbreak.findFirst({
    where: { id: outbreakId, facilityId: user.facilityId },
    include: {
      facility: true,
      lineListEntries: {
        orderBy: { symptomOnsetDate: "asc" },
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
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {outbreak.disease} outbreak
            </h1>
            <p className="text-xs text-slate-600">
              {outbreak.facility.name} · {outbreak.facility.region}
            </p>
          </div>
          <a
            href="/facility/dashboard"
            className="text-xs text-sky-600 hover:text-sky-700"
          >
            Back to dashboard
          </a>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </h2>
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

          <div className="md:col-span-2 rounded-xl bg-white border border-slate-200 p-4 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Upload line list
              </h2>
              <p className="text-xs text-slate-600 mb-2">
                Import people from a CSV or Excel file. Expected columns include{" "}
                <code>name</code>, <code>personType</code>,{" "}
                <code>ageGroup</code>, <code>symptomOnsetDate</code>,{" "}
                <code>symptoms</code>, <code>hospitalised</code>,{" "}
                <code>outcome</code>.
              </p>
              <UploadLineListForm outbreakId={outbreak.id} />
            </div>
            <div className="pt-3 border-t border-slate-200">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Add single person
              </h2>
              <AddLineListEntryForm outbreakId={outbreak.id} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Line list ({outbreak.lineListEntries.length})
            </h2>
          </div>
          <LineListTable
            outbreakId={outbreak.id}
            entries={outbreak.lineListEntries}
          />
        </section>
      </main>
    </div>
  );
}

