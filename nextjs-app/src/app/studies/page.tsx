"use client";

import { useEffect, useState } from "react";

import StudiesTable from "@/components/StudiesTable";
import type { StudySummary } from "@/types/Study";

export default function StudiesPage() {
  const [studies, setStudies] = useState<StudySummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <StudiesTable studies={studies ?? []} />
      </section>
    </main>
  );
}

