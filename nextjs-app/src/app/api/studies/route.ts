import { NextResponse } from "next/server";

import studiesData from "@/app/api/hello/mock/studiesData.json";
import type { Study, StudyIndication, StudyStatus, StudySummary } from "@/types/Study";

export async function GET(): Promise<NextResponse<StudySummary[]>> {
  const studies = studiesData as unknown as Study[];

  const studiesSummary: StudySummary[] = studies.map((study) => ({
    id: study.id,
    patientName: study.patientName,
    patientId: study.patientId,
    studyDate: study.studyDate,
    indication: study.indication as StudyIndication,
    lvef: study.lvef,
    status: study.status as StudyStatus,
  }));

  return NextResponse.json(studiesSummary, { status: 200 });
}

