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

export type HelpOfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN";

export type HelpOffer = {
  id: number;
  reportId: number;
  volunteerId: number;
  message: string;
  status: HelpOfferStatus;
  createdAt: string;
  updatedAt: string;
  volunteerName?: string;
  reportTitle?: string;
  reportType?: ReportType;
  reportStatus?: ReportStatus;
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
    
    getMyReports: builder.query<AnimalReport[], void>({
      query: () => "/reports/mine",
      transformResponse: (response: { reports: AnimalReport[] }) =>
        response.reports,
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
    createHelpOffer: builder.mutation<
      HelpOffer,
      { reportId: number; message: string }
    >({
      query: ({ reportId, message }) => ({
        url: `/reports/${reportId}/offers`,
        method: "POST",
        body: { message },
      }),
      transformResponse: (response: { offer: HelpOffer }) => response.offer,
    }),

    getReportHelpOffers: builder.query<HelpOffer[], number>({
      query: (reportId) => `/reports/${reportId}/offers`,
      transformResponse: (response: { offers: HelpOffer[] }) =>
        response.offers,
    }),

    getMyHelpOffers: builder.query<HelpOffer[], void>({
      query: () => "/reports/offers/mine",
      transformResponse: (response: { offers: HelpOffer[] }) =>
        response.offers,
    }),

    respondToHelpOffer: builder.mutation<
      HelpOffer,
      {
        reportId: number;
        offerId: number;
        status: "ACCEPTED" | "DECLINED";
      }
    >({
      query: ({ reportId, offerId, status }) => ({
        url: `/reports/${reportId}/offers/${offerId}`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (response: { offer: HelpOffer }) => response.offer,
    }),

    withdrawHelpOffer: builder.mutation<HelpOffer, number>({
      query: (offerId) => ({
        url: `/reports/offers/${offerId}/withdraw`,
        method: "PATCH",
      }),
      transformResponse: (response: { offer: HelpOffer }) => response.offer,
    }),
  }),
});

export const { 
  useGetReportsQuery, 
  useGetMyReportsQuery,
  useCreateReportMutation, 
  useUploadReportImageMutation,
  useCreateHelpOfferMutation,
  useGetReportHelpOffersQuery,
  useGetMyHelpOffersQuery,
  useRespondToHelpOfferMutation,
  useWithdrawHelpOfferMutation, 
} = reportsApi;