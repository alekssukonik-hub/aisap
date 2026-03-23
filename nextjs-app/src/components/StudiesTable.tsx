'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { StudyStatus as StudyStatusType, StudySummary } from '@/types/Study';
import { StudyStatus } from '@/types/Study';
import { formatLvef } from '@/utils/formatLvef';

type PageSizeOption = 10 | 25 | 50 | 100;

export type StudiesTableSortKey =
  | 'patientName'
  | 'studyDate'
  | 'indication'
  | 'lvef'
  | 'status';

export type StudiesTableSortDir = 'asc' | 'desc';

type StudiesTableProps = {
  studies: StudySummary[];
  page: number;
  pageSize: PageSizeOption;
  pageSizeOptions: readonly PageSizeOption[];
  /** Query string (e.g. page=2&pageSize=25) preserved when opening a study and when returning. */
  listQueryString?: string;
  sortKey: StudiesTableSortKey | null;
  sortDir: StudiesTableSortDir;
  onSort: (key: StudiesTableSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PageSizeOption) => void;
  onPatientIdClick?: (patientId: string) => void;
  onStatusChange: (studyId: string, status: StudyStatusType) => Promise<void>;
};

function SortableTh({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className = '',
}: {
  label: string;
  columnKey: StudiesTableSortKey;
  sortKey: StudiesTableSortKey | null;
  sortDir: StudiesTableSortDir;
  onSort: (key: StudiesTableSortKey) => void;
  className?: string;
}) {
  const active = sortKey === columnKey;
  return (
    <th
      scope="col"
      className={`px-4 py-2 text-left font-medium text-zinc-700 ${className}`.trim()}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="-mx-1 -my-0.5 inline-flex w-full items-center gap-1 rounded px-1 py-0.5 text-left font-medium text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        <span>{label}</span>
        {active ? (
          <span className="text-zinc-500" aria-hidden>
            {sortDir === 'asc' ? '↑' : '↓'}
          </span>
        ) : null}
      </button>
    </th>
  );
}

export default function StudiesTable({
  studies,
  page,
  pageSize,
  pageSizeOptions,
  listQueryString,
  sortKey,
  sortDir,
  onSort,
  onPageChange,
  onPageSizeChange,
  onPatientIdClick,
  onStatusChange,
}: StudiesTableProps) {
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<StudyStatusType>(StudyStatus.Pending);
  const [savingStudyId, setSavingStudyId] = useState<string | null>(null);

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

  function getVisiblePages(current: number, total: number): Array<number | 'ellipsis'> {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);
    const pages: Array<number | 'ellipsis'> = [1];

    if (left > 2) pages.push('ellipsis');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push('ellipsis');

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
              Showing <span className="font-semibold text-zinc-900">{startItemIndex}</span>-
              <span className="font-semibold text-zinc-900">{endItemIndex}</span> of{' '}
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
              <SortableTh
                label="Patient"
                columnKey="patientName"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="Study Date"
                columnKey="studyDate"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="Indication"
                columnKey="indication"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="LVEF"
                columnKey="lvef"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <SortableTh
                label="Status"
                columnKey="status"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th className="px-4 py-2 text-right font-medium text-zinc-700" />
            </tr>
          </thead>
          <tbody>
            {pageStudies.map((s) => (
              <tr key={s.id} className="group border-t border-zinc-100">
                <td className="px-4 py-2">
                  <div className="font-semibold text-zinc-900">{s.patientName}</div>
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
                <td className="px-4 py-2 text-zinc-900">{String(s.indication)}</td>
                <td className="px-4 py-2 font-semibold text-zinc-900">{formatLvef(s.lvef)}</td>
                <td className="px-4 py-2 text-zinc-900 w-52">
                  {editingStudyId === s.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value as StudyStatusType)}
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900"
                        aria-label={`Edit status for ${s.patientName}`}
                        disabled={savingStudyId === s.id}
                      >
                        {Object.values(StudyStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded-md p-2 text-xl disabled:cursor-not-allowed disabled:opacity-50 ml-auto"
                        onClick={async () => {
                          try {
                            setSavingStudyId(s.id);
                            await onStatusChange(s.id, editingStatus);
                            setEditingStudyId(null);
                          } finally {
                            setSavingStudyId(null);
                          }
                        }}
                        disabled={savingStudyId === s.id}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-zinc-900  disabled:cursor-not-allowed disabled:opacity-50 text-xl"
                        onClick={() => {
                          setEditingStudyId(null);
                          setEditingStatus(s.status);
                        }}
                        disabled={savingStudyId === s.id}
                      >
                        ✖
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span>{String(s.status)}</span>
                      <button
                        type="button"
                        className="invisible rounded-md  p-2 text-zinc-900  group-hover:visible focus-visible:visible text-xl"
                        onClick={() => {
                          setEditingStudyId(s.id);
                          setEditingStatus(s.status);
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={
                      listQueryString ? `/studies/${s.id}?${listQueryString}` : `/studies/${s.id}`
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
                <td className="px-4 py-6 text-center text-zinc-600" colSpan={6}>
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
              if (p === 'ellipsis') {
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
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'rounded-md border border-zinc-200 bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white'
                      : 'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50'
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
