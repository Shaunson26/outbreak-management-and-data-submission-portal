"use client";

import { useState } from "react";

type Props = {
  outbreakId: number;
};

const PERSON_TYPES = [
  { value: "RESIDENT", label: "Resident" },
  { value: "CHILD", label: "Child" },
  { value: "STAFF", label: "Staff" },
];

export function AddLineListEntryForm({ outbreakId }: Props) {
  const [name, setName] = useState("");
  const [personType, setPersonType] = useState("RESIDENT");
  const [ageGroup, setAgeGroup] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [hospitalised, setHospitalised] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/facility/outbreaks/${outbreakId}/line-list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name || undefined,
            personType,
            ageGroup: ageGroup || undefined,
            symptomOnsetDate: onsetDate,
            symptoms: symptoms || undefined,
            hospitalised,
            outcome: outcome || undefined,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not add entry");
      }

      // Simple approach: reload page to reflect new counts & entries
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-black mb-1">
            Name
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Person name (optional)"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Person type
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={personType}
            onChange={(e) => setPersonType(e.target.value)}
          >
            {PERSON_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Age group
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            placeholder="e.g. 80-89"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Onset date
          </label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={onsetDate}
            onChange={(e) => setOnsetDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-black mb-1">
            Symptoms
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. vomiting, diarrhoea"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-black mb-1">
            Outcome
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. recovering"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-black">
          <input
            type="checkbox"
            className="h-3 w-3 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={hospitalised}
            onChange={(e) => setHospitalised(e.target.checked)}
          />
          Hospitalised
        </label>
        {error && (
          <span className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
            {error}
          </span>
        )}
        <div className="flex-1 text-right">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add person"}
          </button>
        </div>
      </div>
    </form>
  );
}

