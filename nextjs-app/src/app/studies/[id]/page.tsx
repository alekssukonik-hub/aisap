"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StudyStatus } from "@/types/Study";
import type { Study } from "@/types/Study";

type StudyDetailResponse = Study | { error: string };

function formatLvef(value: number): string {
  // Mock data uses integer percentages.
  return `${value.toFixed(0)}%`;
}

export default function StudyDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<StudyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;

      try {
        setLoading(true);
        setData(null);
        setUpdateError(null);

        const res = await fetch(`/api/studies/selected/${id}`);
        const json = (await res.json()) as StudyDetailResponse;

        if (!res.ok) {
          throw new Error(json && "error" in json ? json.error : "Failed to load study.");
        }

        if (!cancelled) setData(json);
      } catch (e) {
        if (cancelled) return;
        setData({
          error: e instanceof Error ? e.message : "Failed to load study.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (data && !("error" in data)) {
      setStatusDraft(data.status);
    }
  }, [data]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <p className="text-sm text-zinc-600">Loading study...</p>
      </main>
    );
  }

  if (!data || "error" in data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
        <section className="w-full max-w-3xl">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Back to Home
            </Link>
            <Link
              href="/studies"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Back to Studies
            </Link>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-red-700">{data && "error" in data ? data.error : "Study not found."}</p>
          </div>
        </section>
      </main>
    );
  }

  const study = data;
  const statusOptions = Object.values(StudyStatus);
  const effectiveStatusDraft = statusDraft || study.status;

  async function handleSaveStatus() {
    if (!id) return;
    if (effectiveStatusDraft === study.status) return;

    setUpdatingStatus(true);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/studies/selected/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: effectiveStatusDraft }),
      });

      const json = (await res.json()) as StudyDetailResponse;
      if (!res.ok) {
        throw new Error(json && "error" in json ? json.error : "Failed to update study.");
      }

      setData(json);
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : "Failed to update study.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Study {study.id}
            </h1>
            <p className="mt-2 text-base leading-7 text-zinc-700">
              Detailed information for the selected study from the mock dataset.
            </p>
          </div>

          <nav className="pt-2 flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Back to Home
            </Link>
            <Link
              href="/studies"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Back to Studies
            </Link>
          </nav>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-start gap-4">
              <img
                src={study.thumbnailUrl}
                alt={`Thumbnail for study ${study.id}`}
                className="h-24 w-24 flex-none rounded-md object-cover"
              />
              <div>
                <div className="text-sm font-medium text-zinc-500">Patient</div>
                <div className="text-xl font-semibold text-zinc-900">{study.patientName}</div>
                <div className="text-sm text-zinc-600">{study.patientId}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-zinc-500">Study Date</div>
                <div className="mt-1 text-base font-semibold text-zinc-900">{study.studyDate}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">Indication</div>
                <div className="mt-1 text-base font-semibold text-zinc-900">{String(study.indication)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">LVEF</div>
                <div className="mt-1 text-base font-semibold text-zinc-900">
                  {formatLvef(study.lvef)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">Status</div>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    value={effectiveStatusDraft}
                    onChange={(e) => setStatusDraft(e.target.value)}
                    disabled={updatingStatus}
                    aria-label="Study status"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {String(s)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleSaveStatus}
                    disabled={updatingStatus || effectiveStatusDraft === study.status}
                    aria-label="Save status"
                  >
                    {updatingStatus ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {updateError ? (
              <p className="mt-3 text-sm text-red-700">{updateError}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-900">Raw Record</h2>
            <p className="mt-1 text-sm text-zinc-600">
              This is the detailed payload returned by the API for transparency.
            </p>

            <pre className="mt-4 max-h-[420px] overflow-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
              {JSON.stringify(study, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}

