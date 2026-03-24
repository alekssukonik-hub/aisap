import { NextResponse } from "next/server";

import { StudyStatus } from "@/types/Study";
import type { Study, StudyStatus as StudyStatusType } from "@/types/Study";

import { loadStudies, StudiesStoreError, updateStudyStatusById } from "../studiesStore";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<Study | { error: string }>> {
  let studies: Study[];
  try {
    studies = await loadStudies();
  } catch (error) {
    if (error instanceof StudiesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
  const study = studies.find((s) => s.id === params.id);

  if (!study) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  return NextResponse.json(study, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse<Study | { error: string }>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const maybeStatus = (body as { status?: unknown }).status;
  if (typeof maybeStatus !== "string") {
    return NextResponse.json({ error: "Missing or invalid `status`" }, { status: 400 });
  }

  const status = maybeStatus as StudyStatusType;
  const allowedStatuses = Object.values(StudyStatus) as string[];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid study status" }, { status: 400 });
  }

  let updated: Study | null;
  try {
    updated = await updateStudyStatusById(params.id, status);
  } catch (error) {
    if (error instanceof StudiesStoreError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }
  if (!updated) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  return NextResponse.json(updated, { status: 200 });
}

