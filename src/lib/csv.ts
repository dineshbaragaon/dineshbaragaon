export function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(columns: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [columns.join(","), ...rows.map((row) => row.map(csvField).join(","))];
  return "﻿" + lines.join("\r\n");
}
