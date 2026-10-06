const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001";

export type ReportType =
  | "INJURED"
  | "LOST"
  | "FOUND"
  | "NEEDS_RESCUE";

export type ReportStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type AnimalReport = {
  id: number;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  animalType: "DOG" | "CAT" | "OTHER" | null;
  photoUrl: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export async function getReports(): Promise<AnimalReport[]> {
  const response = await fetch(`${API_URL}/api/reports`);

  if (!response.ok) {
    throw new Error("Failed to load animal reports");
  }

  const data = await response.json();


  return Array.isArray(data) ? data : data.reports;
}