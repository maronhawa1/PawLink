import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useAddVaccinationMutation,
  useGetPetQuery,
  useGetVaccinationsQuery,
  type PetSex,
  type PetSpecies,
  type Vaccination,
} from "../api/petsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import {
  formatDate,
  getAge,
  parseApiDate,
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

export default function PetPassportPage() {
  const { id } = useParams();
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

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

      {!showForm && (
        <div className="passport-actions">
          <button
            type="button"
            className="add-vaccination-button"
            onClick={() => setShowForm(true)}
          >
            + Add vaccination
          </button>
        </div>
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