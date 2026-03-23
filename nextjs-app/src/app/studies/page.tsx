'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import StudiesTable from '@/components/StudiesTable';
import type { StudyIndication, StudyStatus, StudySummary } from '@/types/Study';

const pageSizeOptions = [10, 25, 50, 100] as const;
type PageSize = (typeof pageSizeOptions)[number];
const lvefFilterOptions = ['all', 'normal', 'midly', 'severly'] as const;
type LvefFilter = (typeof lvefFilterOptions)[number];
const studiesPaginationStorageKey = 'studies.pagination';

function isPageSize(value: number): value is PageSize {
  return pageSizeOptions.includes(value as PageSize);
}

function isLvefFilter(value: string): value is LvefFilter {
  return lvefFilterOptions.includes(value as LvefFilter);
}

function StudiesPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [studies, setStudies] = useState<StudySummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indicationFilter, setIndicationFilter] = useState<StudyIndication | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StudyStatus | 'all'>('all');
  const [lvefFilter, setLvefFilter] = useState<'all' | 'normal' | 'midly' | 'severly'>('all');
  const [patientIdFilter, setPatientIdFilter] = useState<string>('');
  const [patientNameFilter, setPatientNameFilter] = useState<string>('');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  function buildListParams({
    nextPage,
    nextPageSize,
    nextIndicationFilter,
    nextStatusFilter,
    nextLvefFilter,
    nextPatientIdFilter,
    nextPatientNameFilter,
  }: {
    nextPage: number;
    nextPageSize: PageSize;
    nextIndicationFilter: StudyIndication | 'all';
    nextStatusFilter: StudyStatus | 'all';
    nextLvefFilter: LvefFilter;
    nextPatientIdFilter: string;
    nextPatientNameFilter: string;
  }) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', String(nextPageSize));
    if (nextIndicationFilter !== 'all') params.set('indication', String(nextIndicationFilter));
    if (nextStatusFilter !== 'all') params.set('status', String(nextStatusFilter));
    if (nextLvefFilter !== 'all') params.set('lvef', nextLvefFilter);
    if (nextPatientIdFilter.trim() !== '') params.set('patientId', nextPatientIdFilter);
    if (nextPatientNameFilter.trim() !== '') params.set('patientName', nextPatientNameFilter);
    return params;
  }

  function syncListStateToUrl({
    nextPage = page,
    nextPageSize = pageSize,
    nextIndicationFilter = indicationFilter,
    nextStatusFilter = statusFilter,
    nextLvefFilter = lvefFilter,
    nextPatientIdFilter = patientIdFilter,
    nextPatientNameFilter = patientNameFilter,
  }: {
    nextPage?: number;
    nextPageSize?: PageSize;
    nextIndicationFilter?: StudyIndication | 'all';
    nextStatusFilter?: StudyStatus | 'all';
    nextLvefFilter?: LvefFilter;
    nextPatientIdFilter?: string;
    nextPatientNameFilter?: string;
  }) {
    const params = buildListParams({
      nextPage,
      nextPageSize,
      nextIndicationFilter,
      nextStatusFilter,
      nextLvefFilter,
      nextPatientIdFilter,
      nextPatientNameFilter,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function readStoredListState():
    | {
        page: number;
        pageSize: PageSize;
        indicationFilter: StudyIndication | 'all';
        statusFilter: StudyStatus | 'all';
        lvefFilter: LvefFilter;
        patientIdFilter: string;
        patientNameFilter: string;
      }
    | null {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(studiesPaginationStorageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as {
        page?: number;
        pageSize?: number;
        indicationFilter?: string;
        statusFilter?: string;
        lvefFilter?: string;
        patientIdFilter?: string;
        patientNameFilter?: string;
      };
      const storedPage =
        typeof parsed.page === 'number' && Number.isInteger(parsed.page) && parsed.page >= 1
          ? parsed.page
          : null;
      const storedPageSize =
        typeof parsed.pageSize === 'number' && isPageSize(parsed.pageSize) ? parsed.pageSize : null;
      if (!storedPage || !storedPageSize) return null;
      return {
        page: storedPage,
        pageSize: storedPageSize,
        indicationFilter:
          typeof parsed.indicationFilter === 'string' && parsed.indicationFilter !== ''
            ? (parsed.indicationFilter as StudyIndication)
            : 'all',
        statusFilter:
          typeof parsed.statusFilter === 'string' && parsed.statusFilter !== ''
            ? (parsed.statusFilter as StudyStatus)
            : 'all',
        lvefFilter:
          typeof parsed.lvefFilter === 'string' && isLvefFilter(parsed.lvefFilter)
            ? parsed.lvefFilter
            : 'all',
        patientIdFilter: typeof parsed.patientIdFilter === 'string' ? parsed.patientIdFilter : '',
        patientNameFilter:
          typeof parsed.patientNameFilter === 'string' ? parsed.patientNameFilter : '',
      };
    } catch {
      return null;
    }
  }

  function handlePatientIdClick(patientId: string) {
    setPatientIdFilter(patientId);
    setPage(1);
    syncListStateToUrl({ nextPage: 1, nextPatientIdFilter: patientId });
  }

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const hasPaginationInUrl = pageParam !== null && pageSizeParam !== null;
    const stored = !hasPaginationInUrl ? readStoredListState() : null;

    const rawPage = Number(pageParam);
    const parsedPageFromUrl = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
    const rawPageSize = Number(pageSizeParam);
    const parsedPageSizeFromUrl = isPageSize(rawPageSize) ? rawPageSize : 10;
    const indicationParam = searchParams.get('indication');
    const statusParam = searchParams.get('status');
    const lvefParam = searchParams.get('lvef');
    const patientIdParam = searchParams.get('patientId');
    const patientNameParam = searchParams.get('patientName');

    const parsedIndicationFilterFromUrl =
      indicationParam && indicationParam !== '' ? (indicationParam as StudyIndication) : 'all';
    const parsedStatusFilterFromUrl =
      statusParam && statusParam !== '' ? (statusParam as StudyStatus) : 'all';
    const parsedLvefFilterFromUrl =
      lvefParam && isLvefFilter(lvefParam) ? lvefParam : 'all';
    const parsedPatientIdFilterFromUrl = patientIdParam ?? '';
    const parsedPatientNameFilterFromUrl = patientNameParam ?? '';

    const parsedPage = stored?.page ?? parsedPageFromUrl;
    const parsedPageSize = stored?.pageSize ?? parsedPageSizeFromUrl;
    const parsedIndicationFilter = stored?.indicationFilter ?? parsedIndicationFilterFromUrl;
    const parsedStatusFilter = stored?.statusFilter ?? parsedStatusFilterFromUrl;
    const parsedLvefFilter = stored?.lvefFilter ?? parsedLvefFilterFromUrl;
    const parsedPatientIdFilter = stored?.patientIdFilter ?? parsedPatientIdFilterFromUrl;
    const parsedPatientNameFilter = stored?.patientNameFilter ?? parsedPatientNameFilterFromUrl;

    setPage((current) => (current === parsedPage ? current : parsedPage));
    setPageSize((current) => (current === parsedPageSize ? current : parsedPageSize));
    setIndicationFilter((current) =>
      current === parsedIndicationFilter ? current : parsedIndicationFilter,
    );
    setStatusFilter((current) => (current === parsedStatusFilter ? current : parsedStatusFilter));
    setLvefFilter((current) => (current === parsedLvefFilter ? current : parsedLvefFilter));
    setPatientIdFilter((current) =>
      current === parsedPatientIdFilter ? current : parsedPatientIdFilter,
    );
    setPatientNameFilter((current) =>
      current === parsedPatientNameFilter ? current : parsedPatientNameFilter,
    );

    const canonicalParams = buildListParams({
      nextPage: parsedPage,
      nextPageSize: parsedPageSize,
      nextIndicationFilter: parsedIndicationFilter,
      nextStatusFilter: parsedStatusFilter,
      nextLvefFilter: parsedLvefFilter,
      nextPatientIdFilter: parsedPatientIdFilter,
      nextPatientNameFilter: parsedPatientNameFilter,
    }).toString();
    if (searchParams.toString() !== canonicalParams) {
      router.replace(`${pathname}?${canonicalParams}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      studiesPaginationStorageKey,
      JSON.stringify({
        page,
        pageSize,
        indicationFilter,
        statusFilter,
        lvefFilter,
        patientIdFilter,
        patientNameFilter,
      }),
    );
  }, [indicationFilter, lvefFilter, page, pageSize, patientIdFilter, patientNameFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/studies');
        const json = (await res.json()) as StudySummary[];

        if (!res.ok) {
          throw new Error('Failed to load studies.');
        }

        if (!cancelled) setStudies(json);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load studies.');
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

  const listQueryString = useMemo(() => {
    return buildListParams({
      nextPage: page,
      nextPageSize: pageSize,
      nextIndicationFilter: indicationFilter,
      nextStatusFilter: statusFilter,
      nextLvefFilter: lvefFilter,
      nextPatientIdFilter: patientIdFilter,
      nextPatientNameFilter: patientNameFilter,
    }).toString();
  }, [indicationFilter, lvefFilter, page, pageSize, patientIdFilter, patientNameFilter, statusFilter]);

  const filteredStudies = useMemo(() => {
    const patientIdNeedle = patientIdFilter.trim().toLowerCase();
    const patientNameNeedle = patientNameFilter.trim().toLowerCase();
    return (studies ?? []).filter((s) => {
      if (indicationFilter !== 'all' && s.indication !== indicationFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (lvefFilter !== 'all') {
        if (lvefFilter === 'normal' && s.lvef < 55) return false;
        if (lvefFilter === 'midly' && (s.lvef < 40 || s.lvef > 54)) return false;
        if (lvefFilter === 'severly' && s.lvef >= 40) return false;
      }
      if (patientIdNeedle && !s.patientId.toLowerCase().includes(patientIdNeedle)) return false;
      if (patientNameNeedle && !s.patientName.toLowerCase().includes(patientNameNeedle))
        return false;
      return true;
    });
  }, [studies, indicationFilter, patientIdFilter, patientNameFilter, statusFilter, lvefFilter]);

  useEffect(() => {
    if (studies === null) return;
    const totalPages = Math.max(1, Math.ceil(filteredStudies.length / pageSize));
    const clampedPage = Math.min(page, totalPages);
    if (clampedPage !== page) {
      setPage(clampedPage);
      syncListStateToUrl({ nextPage: clampedPage });
    }
  }, [filteredStudies.length, page, pageSize, studies]);

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
        <div className="sticky top-4 z-10 rounded-lg border border-zinc-200 bg-white/95 p-4 backdrop-blur">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Filter studies</h1>
          <p className="mt-1 text-sm text-zinc-600 pb-3">
            Refine by indication, status, LVEF, and patient id.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Indication
                </span>
                <select
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={indicationFilter}
                  onChange={(e) => {
                    const nextIndicationFilter = e.target.value as StudyIndication | 'all';
                    setIndicationFilter(nextIndicationFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextIndicationFilter });
                  }}
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
                  onChange={(e) => {
                    const nextStatusFilter = e.target.value as StudyStatus | 'all';
                    setStatusFilter(nextStatusFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextStatusFilter });
                  }}
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
                  LVEF
                </span>
                <select
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={lvefFilter}
                  onChange={(e) => {
                    const nextLvefFilter = e.target.value as LvefFilter;
                    setLvefFilter(nextLvefFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextLvefFilter });
                  }}
                >
                  <option value="all">All LVEF</option>
                  <option value="normal">Normal (&gt;= 55%)</option>
                  <option value="midly">Midly reduces (40% - 54%)</option>
                  <option value="severly">Severly reduces (&lt; 40%)</option>
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
                  onChange={(e) => {
                    const nextPatientIdFilter = e.target.value;
                    setPatientIdFilter(nextPatientIdFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextPatientIdFilter });
                  }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Patient name
                </span>
                <input
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Type to filter"
                  className="w-44 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm hover:bg-zinc-50"
                  value={patientNameFilter}
                  onChange={(e) => {
                    const nextPatientNameFilter = e.target.value;
                    setPatientNameFilter(nextPatientNameFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextPatientNameFilter });
                  }}
                />
              </label>

              <button
                type="button"
                className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 h-10 mt-auto"
                onClick={() => {
                  setIndicationFilter('all');
                  setStatusFilter('all');
                  setLvefFilter('all');
                  setPatientIdFilter('');
                  setPatientNameFilter('');
                  setPage(1);
                  syncListStateToUrl({
                    nextPage: 1,
                    nextIndicationFilter: 'all',
                    nextStatusFilter: 'all',
                    nextLvefFilter: 'all',
                    nextPatientIdFilter: '',
                    nextPatientNameFilter: '',
                  });
                }}
                disabled={
                  indicationFilter === 'all' &&
                  statusFilter === 'all' &&
                  lvefFilter === 'all' &&
                  patientIdFilter.trim() === '' &&
                  patientNameFilter.trim() === ''
                }
              >
                Reset
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-600">
            Showing <span className="font-semibold text-zinc-900">{filteredStudies.length}</span>{' '}
            {filteredStudies.length === 1 ? 'study' : 'studies'}.
          </p>
        </div>

        <StudiesTable
          studies={filteredStudies}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          listQueryString={listQueryString}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            syncListStateToUrl({ nextPage });
          }}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
            syncListStateToUrl({ nextPage: 1, nextPageSize });
          }}
          onPatientIdClick={handlePatientIdClick}
        />
      </section>
    </main>
  );
}

export default function StudiesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
          <p className="text-sm text-zinc-600">Loading studies...</p>
        </main>
      }
    >
      <StudiesPageContent />
    </Suspense>
  );
}
