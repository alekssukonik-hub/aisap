import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { Study } from "@/types/Study";

const STUDIES_DATA_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "./mock/studiesData.json"
);

export class StudiesStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudiesStoreError";
  }
}

async function parseStudies(json: string): Promise<Study[]> {
  try {
    const parsed = JSON.parse(json) as unknown;
    return parsed as Study[];
  } catch {
    throw new StudiesStoreError("Mock studies file was corrupted");
  }
}

export async function loadStudies(): Promise<Study[]> {
  try {
    const raw = await readFile(STUDIES_DATA_PATH, "utf8");
    return parseStudies(raw);
  } catch (error) {
    if (error instanceof StudiesStoreError) {
      throw error;
    }

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new StudiesStoreError("Mock studies file was corrupted");
    }

    throw error;
  }
}

export async function saveStudies(studies: Study[]): Promise<void> {
  // Keep formatting stable for easier diffing.
  const payload = JSON.stringify(studies, null, 2) + "\n";
  await writeFile(STUDIES_DATA_PATH, payload, "utf8");
}

export async function updateStudyStatusById(
  id: string,
  status: Study["status"],
): Promise<Study | null> {
  const studies = await loadStudies();
  const idx = studies.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  studies[idx] = { ...studies[idx], status };
  await saveStudies(studies);
  return studies[idx];
}

