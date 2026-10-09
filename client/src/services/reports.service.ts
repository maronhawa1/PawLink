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

export type ReportDetails = AnimalReport & {
  reporterId: number;
  reporterName: string | null;
  assignedToId: number | null;
  updatedAt: string;
};

export type ReportHistoryEntry = {
  id: number;
  status: ReportStatus;
  message: string | null;
  createdAt: string;
  authorId: number;
  authorName: string | null;
};

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data?.message === "string" ? data.message : fallback;
  } catch {
    return fallback;
  }
}

export async function getReportDetails(
  id: number,
): Promise<{ report: ReportDetails; history: ReportHistoryEntry[] }> {
  const response = await fetch(`${API_URL}/api/reports/${id}`);

  if (!response.ok) {
    throw new Error(
      await readError(response, "Failed to load the report"),
    );
  }

  return response.json();
}

export async function updateReportStatus(
  id: number,
  status: ReportStatus,
  message: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/reports/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, message }),
  });

  if (!response.ok) {
    throw new Error(
      await readError(response, "Failed to update the status"),
    );
  }
}
