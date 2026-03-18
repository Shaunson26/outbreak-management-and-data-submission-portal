"use client";

import { useState } from "react";
import type { LineListEntry } from "@prisma/client";

type Props = {
  outbreakId: number;
  entries: LineListEntry[];
};

export function LineListTable({ outbreakId, entries }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<LineListEntry>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function startEdit(entry: LineListEntry) {
    setEditingId(entry.id);
    setForm({
      name: entry.name ?? "",
      ageGroup: entry.ageGroup ?? "",
      symptomOnsetDate: entry.symptomOnsetDate,
      symptoms: entry.symptoms ?? "",
      hospitalised: entry.hospitalised ?? false,
      outcome: entry.outcome ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({});
    setError(null);
  }

  function updateField<K extends keyof LineListEntry>(
    key: K,
    value: LineListEntry[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEdit(entryId: number) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/facility/outbreaks/${outbreakId}/line-list/${entryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            ageGroup: form.ageGroup,
            symptomOnsetDate: form.symptomOnsetDate
              ? new Date(form.symptomOnsetDate).toISOString().slice(0, 10)
              : undefined,
            symptoms: form.symptoms,
            hospitalised: form.hospitalised,
            outcome: form.outcome,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save changes");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entryId: number) {
    if (!window.confirm("Remove this person from the line list?")) return;
    setDeletingId(entryId);
    setError(null);

    try {
      const res = await fetch(
        `/api/facility/outbreaks/${outbreakId}/line-list/${entryId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete entry");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete entry");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {error && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}
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
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-4 text-center text-xs text-slate-500"
              >
                No people added yet.
              </td>
            </tr>
          ) : (
            entries.map((entry) =>
              editingId === entry.id ? (
                <tr key={entry.id} className="bg-slate-50/60">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-black"
                      value={(form.name as string) ?? ""}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-slate-700">{entry.personType}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-black"
                      value={(form.ageGroup as string) ?? ""}
                      onChange={(e) => updateField("ageGroup", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-black"
                      value={
                        form.symptomOnsetDate
                          ? new Date(
                              form.symptomOnsetDate as unknown as string,
                            )
                              .toISOString()
                              .slice(0, 10)
                          : new Date(entry.symptomOnsetDate)
                              .toISOString()
                              .slice(0, 10)
                      }
                      onChange={(e) =>
                        updateField("symptomOnsetDate", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-black"
                      value={(form.symptoms as string) ?? ""}
                      onChange={(e) => updateField("symptoms", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-300 text-sky-600"
                      checked={
                        typeof form.hospitalised === "boolean"
                          ? (form.hospitalised as boolean)
                          : !!entry.hospitalised
                      }
                      onChange={(e) =>
                        updateField("hospitalised", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-black"
                      value={(form.outcome as string) ?? ""}
                      onChange={(e) => updateField("outcome", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => saveEdit(entry.id)}
                      className="text-xs text-sky-600 hover:text-sky-700"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={cancelEdit}
                      className="text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
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
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      type="button"
                      className="text-xs text-sky-600 hover:text-sky-700"
                      onClick={() => startEdit(entry)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => deleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </>
  );
}

