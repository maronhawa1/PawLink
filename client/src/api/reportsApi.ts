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

export type NewReport = {
  title: string;
  description: string;
  type: ReportType;
  animalType?: AnimalType;
  photoUrl?: string;
  locationText?: string;
  latitude?: number;
  longitude?: number;
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
    createReport: builder.mutation<AnimalReport, NewReport>({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body,
      }),
      transformResponse: (response: { report: AnimalReport }) =>
        response.report,
      invalidatesTags: ["Reports"],
    }),
    uploadReportImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);

        return {
          url: "/uploads/reports",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const { 
  useGetReportsQuery, 
  useCreateReportMutation, 
  useUploadReportImageMutation 
} = reportsApi;