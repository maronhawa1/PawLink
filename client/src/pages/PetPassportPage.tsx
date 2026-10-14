import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAddVaccinationMutation,
  useDeletePetMutation,
  useGetPetQuery,
  useGetVaccinationsQuery,
  useUpdatePetMutation,
  type Pet,
  type PetSex,
  type PetSpecies,
  type Vaccination,
} from "../api/petsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import {
  formatDate,
  getAge,
  parseApiDate,
  toInputDate,
  todayInputValue,
} from "../utils/dates";
import "../styles/pet-passport.css";

const speciesLabels: Record<PetSpecies, string> = {
  DOG: "Dog",
  CAT: "Cat",
  OTHER: "Other",
};

const speciesIcons: Record<PetSpecies, string> = {
  DOG: "🐶",
  CAT: "🐱",
  OTHER: "🐾",
};

const sexLabels: Record<PetSex, string> = {
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "Unknown sex",
};

const sexIcons: Record<PetSex, string> = {
  MALE: "♂",
  FEMALE: "♀",
  UNKNOWN: "?",
};

type PassportStatus = "ok" | "soon" | "overdue" | "empty";

const statusLabels: Record<PassportStatus, string> = {
  ok: "Up to date",
  soon: "Vaccine due soon",
  overdue: "Vaccine overdue",
  empty: "No vaccinations",
};

const DAY = 24 * 60 * 60 * 1000;

function getPassportStatus(vaccinations: Vaccination[]): PassportStatus {
  if (vaccinations.length === 0) {
    return "empty";
  }

  const now = Date.now();
  const dueDates = vaccinations
    .filter((vaccination) => vaccination.nextDueAt)
    .map((vaccination) =>
      parseApiDate(vaccination.nextDueAt as string).getTime(),
    );

  if (dueDates.some((due) => due < now)) {
    return "overdue";
  }

  if (dueDates.some((due) => due - now <= 30 * DAY)) {
    return "soon";
  }

  return "ok";
}

function getNextVaccine(vaccinations: Vaccination[]): Vaccination | null {
  const upcoming = vaccinations.filter((vaccination) => vaccination.nextDueAt);

  if (upcoming.length === 0) {
    return null;
  }

  return upcoming.reduce((earliest, vaccination) =>
    parseApiDate(vaccination.nextDueAt as string) <
    parseApiDate(earliest.nextDueAt as string)
      ? vaccination
      : earliest,
  );
}

function isPast(value: string): boolean {
  return parseApiDate(value).getTime() < Date.now();
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="14" cy="26" rx="6.5" ry="8.5" />
      <ellipse cx="26" cy="14" rx="6.5" ry="9" />
      <ellipse cx="40" cy="14" rx="6.5" ry="9" />
      <ellipse cx="51" cy="26" rx="6.5" ry="8.5" />
      <path d="M32 30c-9 0-17 10-17 18 0 6 5 9 10 8 3-1 5-2 7-2s4 1 7 2c5 1 10-2 10-8 0-8-8-18-17-18z" />
    </svg>
  );
}

const emptyForm = {
  name: "",
  vaccinatedAt: "",
  nextDueAt: "",
  clinicName: "",
  notes: "",
};

type EditForm = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string;
  color: string;
  birthDate: string;
  microchipNumber: string;
  medicalNotes: string;
};

function toEditForm(pet: Pet): EditForm {
  return {
    name: pet.name,
    species: pet.species,
    sex: pet.sex,
    breed: pet.breed ?? "",
    color: pet.color ?? "",
    birthDate: toInputDate(pet.birthDate),
    microchipNumber: pet.microchipNumber ?? "",
    medicalNotes: pet.medicalNotes ?? "",
  };
}

export default function PetPassportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const petId = Number(id);
  const isValidId = Number.isSafeInteger(petId) && petId > 0;

  const {
    data: pet,
    isLoading: isPetLoading,
    error: petError,
  } = useGetPetQuery(petId, { skip: !isValidId });

  const {
    data: vaccinations = [],
    isLoading: isVaccinationsLoading,
    error: vaccinationsError,
  } = useGetVaccinationsQuery(petId, { skip: !isValidId || !pet });

  const [addVaccination, { isLoading: isSaving, error: saveError, reset }] =
    useAddVaccinationMutation();

  const [
    updatePet,
    { isLoading: isUpdating, error: updateError, reset: resetUpdate },
  ] = useUpdatePetMutation();

  const [deletePet, { isLoading: isDeleting, error: deleteError }] =
    useDeletePetMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  function updateEditField(field: keyof EditForm, value: string) {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function openEdit() {
    if (!pet) {
      return;
    }

    closeForm();
    setEditForm(toEditForm(pet));
  }

  function closeEdit() {
    setEditForm(null);
    resetUpdate();
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editForm) {
      return;
    }

    try {
      await updatePet({
        id: petId,
        body: {
          ...editForm,
          name: editForm.name.trim(),
        },
      }).unwrap();
      closeEdit();
    } catch {
      return;
    }
  }

  async function handleDelete() {
    if (!pet) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${pet.name}? This also deletes all of its vaccinations.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePet(petId).unwrap();
      navigate("/my-pets", { replace: true });
    } catch {
      return;
    }
  }

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyForm);
    reset();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await addVaccination({
        petId,
        body: {
          name: form.name.trim(),
          vaccinatedAt: form.vaccinatedAt,
          nextDueAt: form.nextDueAt || undefined,
          clinicName: form.clinicName.trim() || undefined,
          notes: form.notes.trim() || undefined,
        },
      }).unwrap();
      closeForm();
    } catch {
      return;
    }
  }

  if (!isValidId) {
    return (
      <main className="passport-page">
        <p className="passport-message passport-error" role="alert">
          This pet does not exist.
        </p>
        <Link className="passport-back" to="/my-pets">
          ← Back to my pets
        </Link>
      </main>
    );
  }

  if (isPetLoading) {
    return (
      <main className="passport-page">
        <p className="passport-message">Loading passport...</p>
      </main>
    );
  }

  if (petError || !pet) {
    return (
      <main className="passport-page">
        <p className="passport-message passport-error" role="alert">
          {getErrorMessage(petError, "Unable to load this pet")}
        </p>
        <Link className="passport-back" to="/my-pets">
          ← Back to my pets
        </Link>
      </main>
    );
  }

  const age = getAge(pet.birthDate);
  const status = getPassportStatus(vaccinations);
  const nextVaccine = getNextVaccine(vaccinations);
  const nextVaccineOverdue =
    nextVaccine !== null && isPast(nextVaccine.nextDueAt as string);

  const facts = [
    { icon: speciesIcons[pet.species], text: speciesLabels[pet.species] },
    pet.breed ? { icon: "🏷️", text: pet.breed } : null,
    age ? { icon: "📅", text: `${age} old` } : null,
    { icon: sexIcons[pet.sex], text: sexLabels[pet.sex], tone: "sex" },
    pet.color ? { icon: "🎨", text: pet.color } : null,
    pet.microchipNumber
      ? { icon: "#", text: `Chip ${pet.microchipNumber}`, tone: "mono" }
      : null,
  ].filter((fact) => fact !== null);

  return (
    <main className="passport-page">
      <Link className="passport-back" to="/my-pets">
        ← Back to my pets
      </Link>

      <h1 className="passport-heading">{pet.name}'s Pet Passport</h1>

      <div className="passport-sides">
        <section className="passport-side" aria-labelledby="passport-front">
          <h2 id="passport-front" className="passport-side-label">
            Front
          </h2>

          <article className="passport-card">
            <PawIcon className="passport-watermark" />

            <header className="passport-card-header">
              <span className="passport-logo">
                <PawIcon className="passport-logo-icon" />
                PawLink
              </span>
              <span className="passport-kicker">Pet passport</span>
            </header>

            <div className="passport-front-body">
              <div className="passport-photo">
                {pet.photoUrl ? (
                  <img src={pet.photoUrl} alt={pet.name} />
                ) : (
                  <span aria-hidden="true">{speciesIcons[pet.species]}</span>
                )}
              </div>

              <div className="passport-identity">
                <h3>{pet.name}</h3>

                <span className={`passport-status status-${status}`}>
                  <i aria-hidden="true" />
                  {statusLabels[status]}
                </span>

                <ul className="passport-facts">
                  {facts.map((fact) => (
                    <li key={fact.text}>
                      <span
                        className={`fact-icon ${fact.tone ? `fact-${fact.tone}` : ""}`}
                        aria-hidden="true"
                      >
                        {fact.icon}
                      </span>
                      <span
                        className={fact.tone === "sex" ? "fact-sex-text" : ""}
                      >
                        {fact.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="passport-side" aria-labelledby="passport-back">
          <h2 id="passport-back" className="passport-side-label">
            Back
          </h2>

          <article className="passport-card passport-card-back">
            <PawIcon className="passport-corner-paw" />

            <h3>Vaccinations</h3>

            {isVaccinationsLoading && (
              <p className="passport-muted">Loading vaccinations...</p>
            )}

            {vaccinationsError && (
              <p className="passport-message passport-error" role="alert">
                {getErrorMessage(
                  vaccinationsError,
                  "Unable to load vaccinations",
                )}
              </p>
            )}

            {!isVaccinationsLoading &&
              !vaccinationsError &&
              vaccinations.length === 0 && (
                <p className="passport-box passport-muted">
                  No vaccinations recorded yet.
                </p>
              )}

            {vaccinations.length > 0 && (
              <table className="vaccinations-table">
                <tbody>
                  {vaccinations.map((vaccination) => (
                    <tr key={vaccination.id}>
                      <td>
                        {vaccination.name}
                        {vaccination.clinicName && (
                          <small>{vaccination.clinicName}</small>
                        )}
                      </td>
                      <td>{formatDate(vaccination.vaccinatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {nextVaccine && (
              <p className="passport-next">
                Next vaccine:{" "}
                <strong className={nextVaccineOverdue ? "next-overdue" : ""}>
                  {formatDate(nextVaccine.nextDueAt)}
                </strong>{" "}
                ({nextVaccine.name})
              </p>
            )}

            <hr />

            <h3>Medical Notes</h3>
            <p className="passport-box passport-notes">
              {pet.medicalNotes ?? "No known medical conditions."}
            </p>
          </article>
        </section>
      </div>

      {!showForm && !editForm && (
        <div className="passport-actions">
          <button
            type="button"
            className="edit-pet-button"
            onClick={openEdit}
          >
            Edit pet
          </button>
          <button
            type="button"
            className="add-vaccination-button"
            onClick={() => setShowForm(true)}
          >
            + Add vaccination
          </button>
          <button
            type="button"
            className="delete-pet-button"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete pet"}
          </button>
        </div>
      )}

      {deleteError && (
        <p className="passport-message passport-error" role="alert">
          {getErrorMessage(deleteError, "Unable to delete the pet")}
        </p>
      )}

      {editForm && (
        <form className="vaccination-form" onSubmit={handleEditSubmit}>
          <h2>Edit {pet.name}</h2>

          <div className="vaccination-form-grid">
            <label>
              Name
              <input
                value={editForm.name}
                onChange={(event) => updateEditField("name", event.target.value)}
                maxLength={60}
                required
              />
            </label>

            <label>
              Species
              <select
                value={editForm.species}
                onChange={(event) =>
                  updateEditField("species", event.target.value)
                }
              >
                <option value="DOG">Dog</option>
                <option value="CAT">Cat</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label>
              Sex
              <select
                value={editForm.sex}
                onChange={(event) => updateEditField("sex", event.target.value)}
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label>
              Breed
              <input
                value={editForm.breed}
                onChange={(event) =>
                  updateEditField("breed", event.target.value)
                }
                maxLength={60}
              />
            </label>

            <label>
              Color
              <input
                value={editForm.color}
                onChange={(event) =>
                  updateEditField("color", event.target.value)
                }
                maxLength={40}
              />
            </label>

            <label>
              Birth date
              <input
                type="date"
                value={editForm.birthDate}
                max={todayInputValue()}
                onChange={(event) =>
                  updateEditField("birthDate", event.target.value)
                }
              />
            </label>

            <label>
              Microchip number
              <input
                value={editForm.microchipNumber}
                onChange={(event) =>
                  updateEditField("microchipNumber", event.target.value)
                }
                inputMode="numeric"
                pattern="\d{9,15}"
                title="9 to 15 digits"
                placeholder="9–15 digits"
              />
            </label>

            <label className="vaccination-form-wide">
              Medical notes
              <textarea
                value={editForm.medicalNotes}
                onChange={(event) =>
                  updateEditField("medicalNotes", event.target.value)
                }
                maxLength={2000}
                rows={3}
              />
            </label>
          </div>

          {updateError && (
            <p className="passport-message passport-error" role="alert">
              {getErrorMessage(updateError, "Unable to save the changes")}
            </p>
          )}

          <div className="vaccination-form-actions">
            <button type="button" className="cancel-button" onClick={closeEdit}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form className="vaccination-form" onSubmit={handleSubmit}>
          <h2>Add vaccination</h2>

          <div className="vaccination-form-grid">
            <label>
              Vaccine name
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Rabies"
                required
              />
            </label>

            <label>
              Vaccination date
              <input
                type="date"
                value={form.vaccinatedAt}
                max={todayInputValue()}
                onChange={(event) =>
                  updateField("vaccinatedAt", event.target.value)
                }
                required
              />
            </label>

            <label>
              Next due date
              <input
                type="date"
                value={form.nextDueAt}
                min={form.vaccinatedAt || undefined}
                onChange={(event) =>
                  updateField("nextDueAt", event.target.value)
                }
              />
            </label>

            <label>
              Clinic
              <input
                value={form.clinicName}
                onChange={(event) =>
                  updateField("clinicName", event.target.value)
                }
              />
            </label>

            <label className="vaccination-form-wide">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={2}
              />
            </label>
          </div>

          {saveError && (
            <p className="passport-message passport-error" role="alert">
              {getErrorMessage(saveError, "Unable to save the vaccination")}
            </p>
          )}

          <div className="vaccination-form-actions">
            <button type="button" className="cancel-button" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save vaccination"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}