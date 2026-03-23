"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { StudySummary } from "@/types/Study";
import { formatLvef } from "@/utils/formatLvef";

type PageSizeOption = 10 | 25 | 50 | 100;

type StudiesTableProps = {
  studies: StudySummary[];
  page: number;
  pageSize: PageSizeOption;
  pageSizeOptions: readonly PageSizeOption[];
  /** Query string (e.g. page=2&pageSize=25) preserved when opening a study and when returning. */
  listQueryString?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSizeOption) => void;
  onPatientIdClick?: (patientId: string) => void;
};

export default function StudiesTable({
  studies,
  page,
  pageSize,
  pageSizeOptions,
  listQueryString,
  onPageChange,
  onPageSizeChange,
  onPatientIdClick,
}: StudiesTableProps) {
  const totalItems = studies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const { pageStudies, startItemIndex, endItemIndex } = useMemo(() => {
    if (totalItems === 0) {
      return {
        pageStudies: [] as StudySummary[],
        startItemIndex: 0,
        endItemIndex: 0,
      };
    }

    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalItems);
    return {
      pageStudies: studies.slice(start, end),
      startItemIndex: start + 1,
      endItemIndex: end,
    };
  }, [studies, page, pageSize, totalItems]);

  function getVisiblePages(current: number, total: number): Array<number | "ellipsis"> {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    const pages: Array<number | "ellipsis"> = [1];

    if (left > 2) pages.push("ellipsis");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push("ellipsis");

    pages.push(total);
    return pages;
  }

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-zinc-900">Studies</h2>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {totalItems === 0 ? (
            <>No studies available.</>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-zinc-900">{startItemIndex}</span>-
              <span className="font-semibold text-zinc-900">{endItemIndex}</span> of{" "}
              <span className="font-semibold text-zinc-900">{totalItems}</span>
            </>
          )}
        </p>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wider text-zinc-500">
            Items per page
          </span>
          <select
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value) as PageSizeOption);
            }}
            aria-label="Items per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

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
              <th className="px-4 py-2 text-right font-medium text-zinc-700">
                Open
              </th>
            </tr>
          </thead>
          <tbody>
            {pageStudies.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">
                  <div className="font-semibold text-zinc-900">
                    {s.patientName}
                  </div>
                  <button
                    type="button"
                    className="text-left text-xs text-zinc-500 hover:text-zinc-700 hover:underline"
                    onClick={() => onPatientIdClick?.(s.patientId)}
                    aria-label={`Filter studies for patient ${s.patientId}`}
                  >
                    {s.patientId}
                  </button>
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
                <td className="px-4 py-2 text-right">
                  <Link
                    href={
                      listQueryString
                        ? `/studies/${s.id}?${listQueryString}`
                        : `/studies/${s.id}`
                    }
                    aria-label={`Open study ${s.id}`}
                    className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {totalItems === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-600"
                  colSpan={6}
                >
                  No studies available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 sm:justify-end">
            {getVisiblePages(page, totalPages).map((p, idx) => {
              if (p === "ellipsis") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-sm text-zinc-500">
                    ...
                  </span>
                );
              }

              const active = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-md border border-zinc-200 bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white"
                      : "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                  }
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

