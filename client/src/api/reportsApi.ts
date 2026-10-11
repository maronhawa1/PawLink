import { baseApi } from "./baseApi";

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

export type AnimalType = "DOG" | "CAT" | "OTHER";

export type AnimalReport = {
  id: number;
  title: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  animalType: AnimalType | null;
  photoUrl: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

type ReportsResponse = {
  reports: AnimalReport[];
};

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<AnimalReport[], void>({
      query: () => "/reports?limit=100",
      transformResponse: (response: ReportsResponse) => response.reports,
      providesTags: ["Reports"],
    }),
  }),
});

export const { useGetReportsQuery } = reportsApi;