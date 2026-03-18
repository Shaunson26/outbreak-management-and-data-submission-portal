"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DISEASE_OPTIONS = [
  { value: "Influenza", label: "Influenza" },
  { value: "Gastroenteritis", label: "Gastroenteritis" },
];

export default function NewOutbreakPage() {
  const router = useRouter();
  const [disease, setDisease] = useState("Influenza");
  const [onsetDate, setOnsetDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/facility/outbreaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease,
          onsetDate,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create outbreak");
      }

      const data = await res.json();
      router.push(`/facility/outbreaks/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create outbreak");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          New suspected outbreak
        </h1>
        <p className="text-sm text-black mb-6">
          Record a new influenza or gastroenteritis outbreak for your facility.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Disease
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
              >
                {DISEASE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Earliest onset date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Brief description (optional)
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-sky-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g. 3 residents with vomiting and diarrhoea over 24 hours."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/facility/dashboard")}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Create outbreak"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

