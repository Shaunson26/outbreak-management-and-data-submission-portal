import * as XLSX from "xlsx";
import { PersonType } from "@prisma/client";

export type ParsedRow = {
  name?: string;
  personType?: string;
  ageGroup?: string;
  symptomOnsetDate?: string | number;
  symptoms?: string;
  hospitalised?: string | boolean;
  outcome?: string;
};

export function toPersonType(value: string | undefined): PersonType | null {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v.startsWith("res")) return PersonType.RESIDENT;
  if (v.startsWith("child")) return PersonType.CHILD;
  if (v.startsWith("staff")) return PersonType.STAFF;
  return null;
}

/** Excel stores dates as serial number (days since 1900-01-01). Convert to JS Date. */
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 31).getTime(); // Dec 31, 1899 -> serial 1 = Jan 1, 1900
  return new Date(excelEpoch + (serial - 1) * 86400000);
}

export function parseDateString(value: string | number | undefined): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  // Excel exports dates as numbers (e.g. 44927). Treat numeric string or number as Excel serial.
  const asNum = typeof value === "number" ? value : Number(trimmed);
  if (Number.isFinite(asNum) && asNum > 0 && asNum < 300000) {
    return excelSerialToDate(asNum);
  }
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function parseCsv(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const text = new TextDecoder("utf-8").decode(buffer);
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  return dataLines.map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      const value = cols[idx] ?? "";
      if (h === "name") row.name = value;
      if (h === "persontype" || h === "person_type" || h === "role")
        row.personType = value;
      if (h === "agegroup" || h === "age_group") row.ageGroup = value;
      if (h === "symptomonsetdate" || h === "onset" || h === "onsetdate")
        row.symptomOnsetDate = value;
      if (h === "symptoms") row.symptoms = value;
      if (h === "hospitalised" || h === "hospitalized") row.hospitalised = value;
      if (h === "outcome") row.outcome = value;
    });
    return row;
  });
}

export async function parseExcel(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return json.map((row) => {
    const norm = (key: string) =>
      String(row[key] ?? row[key.toLowerCase()] ?? "").trim();
    const dateRaw =
      row["symptomOnsetDate"] ??
      row["SymptomOnsetDate"] ??
      row["onset"] ??
      row["onsetDate"];
    const symptomOnsetDate: string | number | undefined =
      typeof dateRaw === "number" && Number.isFinite(dateRaw)
        ? dateRaw
        : (norm("symptomOnsetDate") ||
            norm("onset") ||
            norm("onsetDate") ||
            norm("SymptomOnsetDate")) || undefined;

    return {
      name: norm("name"),
      personType:
        norm("personType") ||
        norm("person_type") ||
        norm("role") ||
        norm("PersonType"),
      ageGroup: norm("ageGroup") || norm("age_group"),
      symptomOnsetDate,
      symptoms: norm("symptoms"),
      hospitalised:
        (row["hospitalised"] as string | boolean | undefined) ??
        (row["hospitalized"] as string | boolean | undefined),
      outcome: norm("outcome"),
    };
  });
}

export async function parseLineListFile(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParsedRow[]> {
  const name = fileName.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseExcel(buffer);
  }
  if (name.endsWith(".csv")) {
    return parseCsv(buffer);
  }
  throw new Error("Unsupported file type. Use CSV or Excel.");
}
