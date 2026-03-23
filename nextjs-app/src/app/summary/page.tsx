"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  StudyIndication,
  StudyStatus,
  StudySummary,
} from "@/types/Study";

type IndicationSummary = {
  indication: StudyIndication | string;
  count: number;
  avgLvef: number | null;
};

type StudiesOverview = {
  totalStudies: number;
  statusCounts: Record<StudyStatus | string, number>;
  indicationCounts: Record<StudyIndication | string, number>;
  indicationSummaries: IndicationSummary[];
  avgLvef: number | null;
  lvefMin: number | null;
  lvefMax: number | null;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
};

type StudiesSummaryResponse = {
  studies: StudySummary[];
  overview: StudiesOverview;
};

function formatLvef(value: number | null): string {
  if (value === null) return "—";
  // Mock data uses integer percentages.
  return `${value.toFixed(0)}%`;
}

export default function SummaryPage() {
  const [data, setData] = useState<StudiesSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/summary");
        const json = (await res.json()) as StudiesSummaryResponse;

        if (!res.ok) {
          throw new Error("Failed to load studies summary.");
        }

        if (!cancelled) setData(json);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load studies summary.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.overview.statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const indicationRows = useMemo(() => {
    if (!data) return [];
    // API already sorts by count, but keep sorting stable for safety.
    return [...data.overview.indicationSummaries].sort((a, b) => b.count - a.count);
  }, [data]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <p className="text-sm text-zinc-600">Loading summary...</p>
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

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <p className="text-sm text-zinc-600">No summary available.</p>
      </main>
    );
  }

  const { overview, studies } = data;

  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Summary
          </h1>
          <p className="mt-2 text-base leading-7 text-zinc-700">
            Aggregated information across all studies from the mock dataset.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total Studies
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {overview.totalStudies}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Avg LVEF
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {formatLvef(overview.avgLvef)}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              LVEF Range
            </p>
            <p className="mt-2 text-base font-semibold text-zinc-900">
              {formatLvef(overview.lvefMin)} - {formatLvef(overview.lvefMax)}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Date Range
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-900">
              {overview.dateRange.earliest ?? "—"} <span className="text-zinc-400">→</span>{" "}
              {overview.dateRange.latest ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Status Counts</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statusRows.map((row) => (
                    <tr key={row.status} className="border-t border-zinc-100">
                      <td className="px-4 py-2 text-zinc-900">{String(row.status)}</td>
                      <td className="px-4 py-2 font-semibold text-zinc-900">
                        {row.count}
                      </td>
                    </tr>
                  ))}
                  {statusRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-zinc-600" colSpan={2}>
                        No status data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Indication Summaries
            </h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      Indication
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      Count
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-zinc-700">
                      Avg LVEF
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {indicationRows.map((row) => (
                    <tr key={row.indication} className="border-t border-zinc-100">
                      <td className="px-4 py-2 text-zinc-900">
                        {String(row.indication)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-zinc-900">
                        {row.count}
                      </td>
                      <td className="px-4 py-2 font-semibold text-zinc-900">
                        {formatLvef(row.avgLvef)}
                      </td>
                    </tr>
                  ))}
                  {indicationRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-zinc-600" colSpan={3}>
                        No indication data.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-base font-semibold text-zinc-900">Studies</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700">
                    Study Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700">
                    Indication
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700">
                    LVEF
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {studies.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-100">
                    <td className="px-4 py-2">
                      <div className="font-semibold text-zinc-900">
                        {s.patientName}
                      </div>
                      <div className="text-xs text-zinc-500">{s.patientId}</div>
                    </td>
                    <td className="px-4 py-2 text-zinc-900">{s.studyDate}</td>
                    <td className="px-4 py-2 text-zinc-900">
                      {String(s.indication)}
                    </td>
                    <td className="px-4 py-2 font-semibold text-zinc-900">
                      {formatLvef(s.lvef)}
                    </td>
                    <td className="px-4 py-2 text-zinc-900">
                      {String(s.status)}
                    </td>
                  </tr>
                ))}
                {studies.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-600" colSpan={5}>
                      No studies available.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

