'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import StudiesTable, {
  type StudiesTableSortDir,
  type StudiesTableSortKey,
} from '@/components/StudiesTable';
import { LvefFilter, isLvefFilter } from '@/enums/LvefFilter';
import type { StudyIndication, StudyStatus, StudySummary } from '@/types/Study';

const pageSizeOptions = [10, 25, 50, 100] as const;
type PageSize = (typeof pageSizeOptions)[number];
const studiesPaginationStorageKey = 'studies.pagination';

const studiesSortKeys = [
  'patientName',
  'studyDate',
  'indication',
  'lvef',
  'status',
] as const satisfies readonly StudiesTableSortKey[];

function isStudiesSortKey(value: string): value is StudiesTableSortKey {
  return (studiesSortKeys as readonly string[]).includes(value);
}

function isStudiesSortDir(value: string): value is StudiesTableSortDir {
  return value === 'asc' || value === 'desc';
}

function compareStudiesForSort(
  a: StudySummary,
  b: StudySummary,
  key: StudiesTableSortKey,
  dir: StudiesTableSortDir,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  let cmp = 0;
  switch (key) {
    case 'patientName':
      cmp = a.patientName.localeCompare(b.patientName, undefined, { sensitivity: 'base' });
      break;
    case 'studyDate':
      cmp = a.studyDate.localeCompare(b.studyDate);
      break;
    case 'indication':
      cmp = String(a.indication).localeCompare(String(b.indication));
      break;
    case 'lvef':
      cmp = a.lvef - b.lvef;
      break;
    case 'status':
      cmp = String(a.status).localeCompare(String(b.status));
      break;
    default:
      return 0;
  }
  if (cmp !== 0) return mult * cmp;
  return a.id.localeCompare(b.id);
}

function isPageSize(value: number): value is PageSize {
  return pageSizeOptions.includes(value as PageSize);
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
  const [lvefFilter, setLvefFilter] = useState<LvefFilter>(LvefFilter.All);
  const [patientIdFilter, setPatientIdFilter] = useState<string>('');
  const [patientNameFilter, setPatientNameFilter] = useState<string>('');
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<StudiesTableSortKey | null>(null);
  const [sortDir, setSortDir] = useState<StudiesTableSortDir>('asc');

  function buildListParams({
    nextPage,
    nextPageSize,
    nextIndicationFilter,
    nextStatusFilter,
    nextLvefFilter,
    nextPatientIdFilter,
    nextPatientNameFilter,
    nextSortKey,
    nextSortDir,
  }: {
    nextPage: number;
    nextPageSize: PageSize;
    nextIndicationFilter: StudyIndication | 'all';
    nextStatusFilter: StudyStatus | 'all';
    nextLvefFilter: LvefFilter;
    nextPatientIdFilter: string;
    nextPatientNameFilter: string;
    nextSortKey: StudiesTableSortKey | null;
    nextSortDir: StudiesTableSortDir;
  }) {
    const params = new URLSearchParams();
    params.set('page', String(nextPage));
    params.set('pageSize', String(nextPageSize));
    if (nextIndicationFilter !== 'all') params.set('indication', String(nextIndicationFilter));
    if (nextStatusFilter !== 'all') params.set('status', String(nextStatusFilter));
    if (nextLvefFilter !== LvefFilter.All) params.set('lvef', nextLvefFilter);
    if (nextPatientIdFilter.trim() !== '') params.set('patientId', nextPatientIdFilter);
    if (nextPatientNameFilter.trim() !== '') params.set('patientName', nextPatientNameFilter);
    if (nextSortKey !== null) {
      params.set('sort', nextSortKey);
      params.set('sortDir', nextSortDir);
    }
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
    nextSortKey = sortKey,
    nextSortDir = sortDir,
  }: {
    nextPage?: number;
    nextPageSize?: PageSize;
    nextIndicationFilter?: StudyIndication | 'all';
    nextStatusFilter?: StudyStatus | 'all';
    nextLvefFilter?: LvefFilter;
    nextPatientIdFilter?: string;
    nextPatientNameFilter?: string;
    nextSortKey?: StudiesTableSortKey | null;
    nextSortDir?: StudiesTableSortDir;
  }) {
    const params = buildListParams({
      nextPage,
      nextPageSize,
      nextIndicationFilter,
      nextStatusFilter,
      nextLvefFilter,
      nextPatientIdFilter,
      nextPatientNameFilter,
      nextSortKey,
      nextSortDir,
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
        sortKey: StudiesTableSortKey | null;
        sortDir: StudiesTableSortDir;
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
        sort?: string;
        sortDir?: string;
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
            : LvefFilter.All,
        patientIdFilter: typeof parsed.patientIdFilter === 'string' ? parsed.patientIdFilter : '',
        patientNameFilter:
          typeof parsed.patientNameFilter === 'string' ? parsed.patientNameFilter : '',
        ...(() => {
          const sk =
            typeof parsed.sort === 'string' && isStudiesSortKey(parsed.sort) ? parsed.sort : null;
          return {
            sortKey: sk,
            sortDir:
              sk === null
                ? 'asc'
                : typeof parsed.sortDir === 'string' && isStudiesSortDir(parsed.sortDir)
                  ? parsed.sortDir
                  : 'asc',
          };
        })(),
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

  async function handleStatusChange(studyId: string, status: StudyStatus) {
    const res = await fetch(`/api/studies/${studyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error('Failed to update study status.');
    }

    setStudies((current) => {
      if (!current) return current;
      return current.map((study) => (study.id === studyId ? { ...study, status } : study));
    });
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
      lvefParam && isLvefFilter(lvefParam) ? lvefParam : LvefFilter.All;
    const parsedPatientIdFilterFromUrl = patientIdParam ?? '';
    const parsedPatientNameFilterFromUrl = patientNameParam ?? '';

    const sortParam = searchParams.get('sort');
    const sortDirParam = searchParams.get('sortDir');
    const parsedSortKeyFromUrl =
      sortParam && isStudiesSortKey(sortParam) ? sortParam : null;
    const parsedSortDirFromUrl =
      sortDirParam && isStudiesSortDir(sortDirParam) ? sortDirParam : 'asc';

    const parsedPage = stored?.page ?? parsedPageFromUrl;
    const parsedPageSize = stored?.pageSize ?? parsedPageSizeFromUrl;
    const parsedIndicationFilter = stored?.indicationFilter ?? parsedIndicationFilterFromUrl;
    const parsedStatusFilter = stored?.statusFilter ?? parsedStatusFilterFromUrl;
    const parsedLvefFilter = stored?.lvefFilter ?? parsedLvefFilterFromUrl;
    const parsedPatientIdFilter = stored?.patientIdFilter ?? parsedPatientIdFilterFromUrl;
    const parsedPatientNameFilter = stored?.patientNameFilter ?? parsedPatientNameFilterFromUrl;
    const parsedSortKey = stored?.sortKey ?? parsedSortKeyFromUrl;
    const parsedSortDirRaw = stored?.sortDir ?? parsedSortDirFromUrl;
    const parsedSortDir =
      parsedSortKey === null ? 'asc' : parsedSortDirRaw;

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
    setSortKey((current) => (current === parsedSortKey ? current : parsedSortKey));
    setSortDir((current) => (current === parsedSortDir ? current : parsedSortDir));

    const canonicalParams = buildListParams({
      nextPage: parsedPage,
      nextPageSize: parsedPageSize,
      nextIndicationFilter: parsedIndicationFilter,
      nextStatusFilter: parsedStatusFilter,
      nextLvefFilter: parsedLvefFilter,
      nextPatientIdFilter: parsedPatientIdFilter,
      nextPatientNameFilter: parsedPatientNameFilter,
      nextSortKey: parsedSortKey,
      nextSortDir: parsedSortDir,
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
        sort: sortKey,
        sortDir,
      }),
    );
  }, [
    indicationFilter,
    lvefFilter,
    page,
    pageSize,
    patientIdFilter,
    patientNameFilter,
    sortDir,
    sortKey,
    statusFilter,
  ]);

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
      nextSortKey: sortKey,
      nextSortDir: sortDir,
    }).toString();
  }, [
    indicationFilter,
    lvefFilter,
    page,
    pageSize,
    patientIdFilter,
    patientNameFilter,
    sortDir,
    sortKey,
    statusFilter,
  ]);

  const filteredStudies = useMemo(() => {
    const patientIdNeedle = patientIdFilter.trim().toLowerCase();
    const patientNameNeedle = patientNameFilter.trim().toLowerCase();
    return (studies ?? []).filter((s) => {
      if (indicationFilter !== 'all' && s.indication !== indicationFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (lvefFilter !== LvefFilter.All) {
        if (lvefFilter === LvefFilter.Normal && s.lvef < 55) return false;
        if (lvefFilter === LvefFilter.Midly && (s.lvef < 40 || s.lvef > 54)) return false;
        if (lvefFilter === LvefFilter.Severly && s.lvef >= 40) return false;
      }
      if (patientIdNeedle && !s.patientId.toLowerCase().includes(patientIdNeedle)) return false;
      if (patientNameNeedle && !s.patientName.toLowerCase().includes(patientNameNeedle))
        return false;
      return true;
    });
  }, [studies, indicationFilter, patientIdFilter, patientNameFilter, statusFilter, lvefFilter]);

  const sortedStudies = useMemo(() => {
    if (sortKey === null) return filteredStudies;
    return [...filteredStudies].sort((a, b) => compareStudiesForSort(a, b, sortKey, sortDir));
  }, [filteredStudies, sortDir, sortKey]);

  useEffect(() => {
    if (studies === null) return;
    const totalPages = Math.max(1, Math.ceil(sortedStudies.length / pageSize));
    const clampedPage = Math.min(page, totalPages);
    if (clampedPage !== page) {
      setPage(clampedPage);
      syncListStateToUrl({ nextPage: clampedPage });
    }
  }, [page, pageSize, sortedStudies.length, studies]);

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
                    const v = e.target.value;
                    const nextLvefFilter = isLvefFilter(v) ? v : LvefFilter.All;
                    setLvefFilter(nextLvefFilter);
                    setPage(1);
                    syncListStateToUrl({ nextPage: 1, nextLvefFilter });
                  }}
                >
                  <option value={LvefFilter.All}>All LVEF</option>
                  <option value={LvefFilter.Normal}>Normal (&gt;= 55%)</option>
                  <option value={LvefFilter.Midly}>Midly reduces (40% - 54%)</option>
                  <option value={LvefFilter.Severly}>Severly reduces (&lt; 40%)</option>
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
                  setLvefFilter(LvefFilter.All);
                  setPatientIdFilter('');
                  setPatientNameFilter('');
                  setPage(1);
                  setSortKey(null);
                  setSortDir('asc');
                  syncListStateToUrl({
                    nextPage: 1,
                    nextIndicationFilter: 'all',
                    nextStatusFilter: 'all',
                    nextLvefFilter: LvefFilter.All,
                    nextPatientIdFilter: '',
                    nextPatientNameFilter: '',
                    nextSortKey: null,
                    nextSortDir: 'asc',
                  });
                }}
                disabled={
                  indicationFilter === 'all' &&
                  statusFilter === 'all' &&
                  lvefFilter === LvefFilter.All &&
                  patientIdFilter.trim() === '' &&
                  patientNameFilter.trim() === '' &&
                  sortKey === null
                }
              >
                Reset
              </button>
            </div>
          </div>

        </div>

        <StudiesTable
          studies={sortedStudies}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          listQueryString={listQueryString}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={(key) => {
            if (sortKey === key) {
              const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
              setSortDir(nextDir);
              syncListStateToUrl({ nextSortDir: nextDir });
            } else {
              setSortKey(key);
              setSortDir('asc');
              setPage(1);
              syncListStateToUrl({ nextPage: 1, nextSortKey: key, nextSortDir: 'asc' });
            }
          }}
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
          onStatusChange={handleStatusChange}
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
