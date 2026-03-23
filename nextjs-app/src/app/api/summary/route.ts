import studiesData from "@/app/api/hello/mock/studiesData.json";
import { NextResponse } from "next/server";

import type { Study, StudyIndication, StudyStatus, StudySummary } from "@/types/Study";

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

function parseStudyDateMs(studyDate: string): number | null {
  const ms = new Date(studyDate).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export async function GET(): Promise<NextResponse<StudiesSummaryResponse>> {
  const studies = studiesData as unknown as Study[];

  const totalStudies = studies.length;

  const studiesSummary: StudySummary[] = studies.map((study) => ({
    id: study.id,
    patientName: study.patientName,
    patientId: study.patientId,
    studyDate: study.studyDate,
    indication: study.indication as StudyIndication,
    lvef: study.lvef,
    status: study.status as StudyStatus,
  }));

  const statusCounts: Record<StudyStatus | string, number> = {};
  const indicationCounts: Record<StudyIndication | string, number> = {};

  // For per-indication aggregates.
  const indicationLvefAcc: Record<string, { count: number; lvefSum: number }> = {};

  let lvefSum = 0;
  let lvefCount = 0;
  let lvefMin: number | null = null;
  let lvefMax: number | null = null;

  let earliestDate: { ms: number; value: string } | null = null;
  let latestDate: { ms: number; value: string } | null = null;

  for (const study of studies) {
    const status = study.status as StudyStatus | string;
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    const indication = study.indication as StudyIndication | string;
    indicationCounts[indication] = (indicationCounts[indication] ?? 0) + 1;

    // lvef is expected to be a number in the mock data.
    if (typeof study.lvef === "number" && Number.isFinite(study.lvef)) {
      lvefSum += study.lvef;
      lvefCount += 1;
      lvefMin = lvefMin === null ? study.lvef : Math.min(lvefMin, study.lvef);
      lvefMax = lvefMax === null ? study.lvef : Math.max(lvefMax, study.lvef);

      const acc = indicationLvefAcc[indication] ?? { count: 0, lvefSum: 0 };
      acc.count += 1;
      acc.lvefSum += study.lvef;
      indicationLvefAcc[indication] = acc;
    }

    const studyDateMs = parseStudyDateMs(study.studyDate);
    if (studyDateMs !== null) {
      if (earliestDate === null || studyDateMs < earliestDate.ms) {
        earliestDate = { ms: studyDateMs, value: study.studyDate };
      }
      if (latestDate === null || studyDateMs > latestDate.ms) {
        latestDate = { ms: studyDateMs, value: study.studyDate };
      }
    }
  }

  const avgLvef = lvefCount > 0 ? lvefSum / lvefCount : null;

  const indicationSummaries: IndicationSummary[] = Object.entries(indicationLvefAcc)
    .map(([indication, acc]) => ({
      indication,
      count: acc.count,
      avgLvef: acc.count > 0 ? acc.lvefSum / acc.count : null,
    }))
    .sort((a, b) => b.count - a.count);

  const response: StudiesSummaryResponse = {
    studies: studiesSummary,
    overview: {
      totalStudies,
      statusCounts,
      indicationCounts,
      indicationSummaries,
      avgLvef,
      lvefMin,
      lvefMax,
      dateRange: {
        earliest: earliestDate?.value ?? null,
        latest: latestDate?.value ?? null,
      },
    },
  };

  return NextResponse.json(response, { status: 200 });
}

