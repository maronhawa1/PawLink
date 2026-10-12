import { baseApi } from "./baseApi";

export type PetSpecies = "DOG" | "CAT" | "OTHER";
export type PetSex = "MALE" | "FEMALE" | "UNKNOWN";

export type Pet = {
  id: number;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string | null;
  color: string | null;
  birthDate: string | null;
  microchipNumber: string | null;
  photoUrl: string | null;
  medicalNotes: string | null;
  createdAt: string;
};

export type NewPet = {
  name: string;
  species: PetSpecies;
  sex?: PetSex;
  breed?: string;
  color?: string;
  birthDate?: string;
  microchipNumber?: string;
  photoUrl?: string;
  medicalNotes?: string;
};

export type Vaccination = {
  id: number;
  name: string;
  vaccinatedAt: string;
  nextDueAt: string | null;
  clinicName: string | null;
  notes: string | null;
  documentUrl: string | null;
  petId: number;
};

export type NewVaccination = {
  name: string;
  vaccinatedAt: string;
  nextDueAt?: string;
  clinicName?: string;
  notes?: string;
};

export const petsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPets: builder.query<Pet[], void>({
      query: () => "/pets",
      transformResponse: (response: { pets: Pet[] }) => response.pets,
      providesTags: ["Pets"],
    }),
    getPet: builder.query<Pet, number>({
      query: (id) => `/pets/${id}`,
      transformResponse: (response: { pet: Pet }) => response.pet,
      providesTags: (_result, _error, id) => [{ type: "Pets", id }],
    }),
    uploadPetImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("image", file);

        return {
          url: "/uploads/pets",
          method: "POST",
          body: formData,
        };
      },
    }),
    addPet: builder.mutation<Pet, NewPet>({
      query: (body) => ({
        url: "/pets",
        method: "POST",
        body,
      }),
      transformResponse: (response: { pet: Pet }) => response.pet,
      invalidatesTags: ["Pets"],
    }),
    getVaccinations: builder.query<Vaccination[], number>({
      query: (petId) => `/pets/${petId}/vaccinations`,
      transformResponse: (response: { vaccinations: Vaccination[] }) =>
        response.vaccinations,
      providesTags: (_result, _error, petId) => [
        { type: "Vaccinations", id: petId },
      ],
    }),
    addVaccination: builder.mutation<
      Vaccination,
      { petId: number; body: NewVaccination }
    >({
      query: ({ petId, body }) => ({
        url: `/pets/${petId}/vaccinations`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { vaccination: Vaccination }) =>
        response.vaccination,
      invalidatesTags: (_result, _error, { petId }) => [
        { type: "Vaccinations", id: petId },
      ],
    }),
  }),
});

export const {
  useGetPetsQuery,
  useGetPetQuery,
  useUploadPetImageMutation,
  useAddPetMutation,
  useGetVaccinationsQuery,
  useAddVaccinationMutation,
} = petsApi;