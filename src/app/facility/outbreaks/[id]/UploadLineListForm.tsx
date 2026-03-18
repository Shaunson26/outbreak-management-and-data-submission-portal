"use client";

import { useState } from "react";

export type PreviewRow = {
  name?: string;
  personType?: string;
  ageGroup?: string;
  symptomOnsetDate?: string;
  symptoms?: string;
  hospitalised?: string | boolean;
  outcome?: string;
};

export function UploadLineListForm({ outbreakId }: { outbreakId: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPreviewRows(null);

    if (!file) {
      setError("Please choose a CSV or Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch(
        `/api/facility/outbreaks/${outbreakId}/line-list/upload/preview`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to parse file");
      }

      setPreviewRows(data.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setPreviewRows(null);
    setError(null);
  }

  async function confirmImport() {
    if (!previewRows || previewRows.length === 0) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/facility/outbreaks/${outbreakId}/line-list/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: previewRows }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      closeModal();
      setFile(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <form onSubmit={handlePreview} className="space-y-2">
        <label className="block text-xs font-medium text-black mb-1">
          Upload line list (CSV or Excel)
        </label>
        <input
          type="file"
          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setPreviewRows(null);
          }}
          className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
        />
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {loading ? "Parsing..." : "Preview import"}
        </button>
      </form>

      {previewRows !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2
                id="preview-modal-title"
                className="text-sm font-semibold text-slate-900"
              >
                Review imported line list ({previewRows.length} rows)
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700 text-sm"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            <div className="overflow-auto flex-1 min-h-0 p-4">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold text-slate-600 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Person type</th>
                    <th className="px-3 py-2">Age group</th>
                    <th className="px-3 py-2">Onset date</th>
                    <th className="px-3 py-2">Symptoms</th>
                    <th className="px-3 py-2">Hospitalised</th>
                    <th className="px-3 py-2">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-900">
                        {row.name ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.personType ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.ageGroup ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.symptomOnsetDate ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.symptoms ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {typeof row.hospitalised === "boolean"
                          ? row.hospitalised
                            ? "Yes"
                            : "No"
                          : String(row.hospitalised ?? "-")}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.outcome ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importing}
                className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-60"
              >
                {importing ? "Importing..." : "Import into line list"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
