
import "../styles/add-pet-form.css";
import catImage from "../assets/images/add-pet/cat.png";
import dogImage from "../assets/images/add-pet/dog.png";
import otherImage from "../assets/images/add-pet/other-pets.jpg";
import dogDesktop from "../assets/images/add-pet/dog-desktop.png";
import catDesktop from "../assets/images/add-pet/cat-desktop.png";
import otherDesktop from "../assets/images/add-pet/other-pets-desktop.jpg";

import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useAddPetMutation,
  useUploadPetImageMutation,
  type NewPet,
} from "../api/petsApi";
import { getErrorMessage } from "../api/getErrorMessage";

const speciesImages = {
  DOG: dogImage,
  CAT: catImage,
  OTHER: otherImage,
};
const desktopSpeciesImages = {
  DOG: dogDesktop,
  CAT: catDesktop,
  OTHER: otherDesktop,
};

export default function AddPetPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<NewPet>({
    name: "",
    species: "DOG",
    sex: "UNKNOWN",
    breed: "",
    birthDate: "",
    color: "",
    microchipNumber: "",
    medicalNotes: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const [uploadImage, { isLoading: isUploading }] =
    useUploadPetImageMutation();
  const [addPet, { isLoading: isSaving }] = useAddPetMutation();

  const isSubmitting = isUploading || isSaving;

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function updateField<K extends keyof NewPet>(
    field: K,
    value: NewPet[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setFormError("");

    try {
      let photoUrl: string | undefined;

      if (photo) {
        const result = await uploadImage(photo).unwrap();
        photoUrl = result.url;
      }

      const pet = await addPet({
        ...form,
        name: form.name.trim(),
        breed: form.breed?.trim() || undefined,
        birthDate: form.birthDate || undefined,
        color: form.color?.trim() || undefined,
        microchipNumber: form.microchipNumber?.trim() || undefined,
        medicalNotes: form.medicalNotes?.trim() || undefined,
        photoUrl,
      }).unwrap();

      navigate(`/my-pets/${pet.id}`);
    } catch (error) {
      setFormError(
        getErrorMessage(
          error as Parameters<typeof getErrorMessage>[0],
          "Failed to add pet",
        ),
      );
    }
  }

  const selectedImage = speciesImages[form.species];

  return (
    <main className="add-pet-page">
      <Link to="/my-pets" className="add-pet-back">
        <span aria-hidden="true">←</span> Back to My Pets
      </Link>

      <div className="add-pet-card">
        <aside className="add-pet-visual">
          <picture>
            <source
                media="(min-width: 851px)"
                srcSet={desktopSpeciesImages[form.species]}
            />
            <img
                src={selectedImage}
                alt={`A ${form.species.toLowerCase()} pet`}
                className="add-pet-hero-image"
            />
          </picture>
        </aside>

        <section className="add-pet-content">
          <div className="add-pet-heading">
            <span className="add-pet-eyebrow">
              YOUR PET'S DIGITAL PASSPORT
            </span>
            <h1>Add your pet <span aria-hidden="true">🐾</span></h1>
            <p>
              Tell us a little about your companion.
              Their passport starts here!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="add-pet-form">
            <label>
              Pet name *
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="What's your pet's name?"
                maxLength={60}
                required
              />
            </label>

            <label>
              Species *
              <select
                value={form.species}
                onChange={(e) =>
                  updateField(
                    "species",
                    e.target.value as NewPet["species"],
                  )
                }
              >
                <option value="DOG">Dog</option>
                <option value="CAT">Cat</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Breed
              <input
                value={form.breed ?? ""}
                onChange={(e) => updateField("breed", e.target.value)}
                placeholder={
                    form.species === "DOG"
                        ? "e.g. Golden Retriever"
                        : form.species === "CAT"
                        ? "e.g. British Shorthair"
                        : "e.g. Holland Lop"
                }
                maxLength={60}
              />
            </label>

            <label>
              Birth date
              <input
                type="date"
                value={form.birthDate ?? ""}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(e) =>
                  updateField("birthDate", e.target.value)
                }
              />
            </label>

            <label>
              Sex
              <select
                value={form.sex}
                onChange={(e) =>
                  updateField("sex", e.target.value as NewPet["sex"])
                }
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label>
              Color
              <input
                value={form.color ?? ""}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="e.g. Brown and white"
                maxLength={40}
              />
            </label>

            <label>
              Microchip number
              <input
                value={form.microchipNumber ?? ""}
                onChange={(e) =>
                  updateField("microchipNumber", e.target.value)
                }
                placeholder="9–15 digits (optional)"
                inputMode="numeric"
                pattern="[0-9]{9,15}"
                title="Enter 9 to 15 digits"
              />
            </label>

            <div className="add-pet-photo-field">
              <span className="add-pet-field-label">Pet photo</span>

              <div className="add-pet-photo-row">
                <div className="add-pet-photo-preview">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Selected pet preview" />
                  ) : (
                    <span aria-hidden="true">📷</span>
                  )}
                </div>

                <div className="add-pet-photo-actions">
                  <label
                    htmlFor="add-pet-photo"
                    className="add-pet-photo-button"
                  >
                    {photo ? "Change photo" : "Choose a photo"}
                  </label>

                  <input
                    id="add-pet-photo"
                    className="add-pet-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setPhoto(file);
                    }}
                  />

                  <span className="add-pet-photo-hint">
                    {photo
                      ? photo.name
                      : "JPEG, PNG or WebP"}
                  </span>
                </div>

                {photo && (
                  <button
                    type="button"
                    className="add-pet-remove-photo"
                    onClick={() => {
                      setPhoto(null);
                      const input = document.getElementById(
                        "add-pet-photo",
                      ) as HTMLInputElement | null;
                      if (input) input.value = "";
                    }}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <label className="add-pet-notes-field">
              Medical notes
              <textarea
                value={form.medicalNotes ?? ""}
                onChange={(e) =>
                  updateField("medicalNotes", e.target.value)
                }
                placeholder="Anything important about your pet's health?"
                maxLength={2000}
                rows={3}
              />
            </label>

            {formError && (
              <p className="add-pet-error" role="alert">
                {formError}
              </p>
            )}

            <button
              className="add-pet-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isUploading
                ? "Uploading photo..."
                : isSaving
                  ? "Creating passport..."
                  : "Create Pet Passport →"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
