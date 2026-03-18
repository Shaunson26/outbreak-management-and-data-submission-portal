"use client";

import React from "react";

export function PhuStatusForm({
  outbreakId,
  currentStatus,
}: {
  outbreakId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = React.useState(currentStatus);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/phu/outbreaks/${outbreakId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not update status");
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update status",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Status
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="NEW">New</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-black mb-1">
          Note (optional)
        </label>
        <textarea
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Short note about decision or follow-up."
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save status"}
      </button>
    </form>
  );
}

