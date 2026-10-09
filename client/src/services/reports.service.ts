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

export type MapReportFilters = {
  types?: ReportType[];
  statuses?: ReportStatus[];
  // [south, west, north, east] of the visible map area
  bounds?: [number, number, number, number];
};

export type MapReportsResponse = {
  reports: AnimalReport[];
  count: number;
  truncated: boolean;
};

// Reports with coordinates for the map. Not paginated; capped on the server.
export async function getMapReports(
  filters: MapReportFilters = {},
): Promise<MapReportsResponse> {
  const params = new URLSearchParams();

  if (filters.types?.length) {
    params.set("type", filters.types.join(","));
  }

  if (filters.statuses?.length) {
    params.set("status", filters.statuses.join(","));
  }

  if (filters.bounds) {
    params.set("bounds", filters.bounds.join(","));
  }

  const query = params.toString();
  const response = await fetch(
    `${API_URL}/api/reports/map${query ? `?${query}` : ""}`,
  );

  if (!response.ok) {
    throw new Error("Failed to load map reports");
  }

  return response.json();
}

export async function getReports(): Promise<AnimalReport[]> {
  const response = await fetch(`${API_URL}/api/reports`);

  if (!response.ok) {
    throw new Error("Failed to load animal reports");
  }

  const data = await response.json();


  return Array.isArray(data) ? data : data.reports;
}