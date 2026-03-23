"use client";

import { useEffect, useMemo, useState } from "react";

import StudiesTable from "@/components/StudiesTable";
import type { StudyIndication, StudyStatus, StudySummary } from "@/types/Study";

export default function StudiesPage() {
  const [studies, setStudies] = useState<StudySummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indicationFilter, setIndicationFilter] = useState<StudyIndication | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StudyStatus | "all">("all");
  const [patientIdFilter, setPatientIdFilter] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/studies");
        const json = (await res.json()) as StudySummary[];

        if (!res.ok) {
          throw new Error("Failed to load studies.");
        }

        if (!cancelled) setStudies(json);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load studies.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const indicationOptions = useMemo(() => {
    const values = Array.from(new Set((studies ?? []).map((s) => s.indication)));
    return values.sort((a, b) => String(a).localeCompare(String(b)));
  }, [studies]);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set((studies ?? []).map((s) => s.status)));
    return values.sort((a, b) => String(a).localeCompare(String(b)));
  }, [studies]);

  const filteredStudies = useMemo(() => {
    const patientIdNeedle = patientIdFilter.trim().toLowerCase();
    return (studies ?? []).filter((s) => {
      if (indicationFilter !== "all" && s.indication !== indicationFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (patientIdNeedle && !s.patientId.toLowerCase().includes(patientIdNeedle)) return false;
      return true;
    });
  }, [studies, indicationFilter, patientIdFilter, statusFilter]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <p className="text-sm text-zinc-600">Loading studies...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <p className="max-w-2xl text-sm text-red-700">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-5xl">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                Filter studies
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Refine by indication, status, and patient id.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Indication
                </span>
                <select
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={indicationFilter}
                  onChange={(e) => setIndicationFilter(e.target.value as StudyIndication | "all")}
                >
                  <option value="all">All indications</option>
                  {indicationOptions.map((indication) => (
                    <option key={indication} value={indication}>
                      {indication}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </span>
                <select
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StudyStatus | "all")}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Patient ID
                </span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="Type to filter"
                  className="w-44 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={patientIdFilter}
                  onChange={(e) => setPatientIdFilter(e.target.value)}
                />
              </label>

              <div className="flex items-center">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setIndicationFilter("all");
                    setStatusFilter("all");
                    setPatientIdFilter("");
                  }}
                  disabled={
                    indicationFilter === "all" &&
                    statusFilter === "all" &&
                    patientIdFilter.trim() === ""
                  }
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-600">
            Showing{" "}
            <span className="font-semibold text-zinc-900">{filteredStudies.length}</span>{" "}
            {filteredStudies.length === 1 ? "study" : "studies"}.
          </p>
        </div>

        <StudiesTable studies={filteredStudies} />
      </section>
    </main>
  );
}

