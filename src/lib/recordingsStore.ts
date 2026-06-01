import type { DataPoint, Recording } from "./types";

const KEY = "recordings";

export function loadRecordings(): Recording[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Recording[]) : [];
  } catch {
    return [];
  }
}

export function saveRecording(rec: Recording): void {
  const all = loadRecordings();
  all.unshift(rec);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteRecording(id: string): void {
  const all = loadRecordings().filter(r => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export type { DataPoint, Recording };
