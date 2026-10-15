import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGetPetsQuery, type PetSpecies } from "../api/petsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import { getReports, type AnimalReport } from "../services/reports.service";
import { useAppSelector } from "../store/hooks";
import { getAge } from "../utils/dates";
import "../styles/dashboard.css";

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

const reportTypeLabels: Record<AnimalReport["type"], string> = {
  INJURED: "Injured animal",
  LOST: "Lost animal",
  FOUND: "Found animal",
  NEEDS_RESCUE: "Needs rescue",
};

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: pets = [],
    isLoading: petsLoading,
    error: petsError,
  } = useGetPetsQuery();

  const [reports, setReports] = useState<AnimalReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const data = await getReports();

        if (active) {
          setReports(
            [...data]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 4)
          );
        }
      } catch {
        if (active) {
          setReportsError("Unable to load recent reports.");
        }
      } finally {
        if (active) {
          setReportsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, []);

  const recentPets = pets.slice(0, 4);
  const firstWord = user?.name?.trim().split(/\s+/)[0];
  const firstName = firstWord
    ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
    : "there";

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">
            Welcome to your community
          </span>

          <h1>Welcome back, {firstName}!</h1>

          <p>
            Your space to care for your pets, help animals in need,
            and make your community safer.
          </p>

          <div className="dashboard-hero-actions">
            <Link className="dashboard-button primary" to="/my-pets">
              My Pets
            </Link>

            <Link className="dashboard-button secondary" to="/reports/new">
              Report an Animal
            </Link>
          </div>
        </div>

        <div className="dashboard-hero-image" aria-hidden="true" />
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Your Pets</h2>
            <p>Your companions and their digital passports.</p>
          </div>

          <Link to="/my-pets" className="dashboard-text-link">
            Go to My Pets →
          </Link>
        </div>

        {petsLoading && (
          <p className="dashboard-message">Loading your pets...</p>
        )}

        {petsError && (
          <p className="dashboard-message dashboard-error" role="alert">
            {getErrorMessage(petsError, "Unable to load your pets")}
          </p>
        )}

        {!petsLoading && !petsError && recentPets.length === 0 && (
          <div className="dashboard-empty">
            <span aria-hidden="true">🐾</span>
            <h3>No pets added yet</h3>
            <p>Your registered pets will appear here.</p>
          </div>
        )}

        {!petsLoading && !petsError && recentPets.length > 0 && (
          <div className="dashboard-pets-grid">
            {recentPets.map((pet) => (
              <Link
                key={pet.id}
                to={`/my-pets/${pet.id}`}
                className="dashboard-pet-card"
              >
                <div className="dashboard-pet-photo">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} />
                  ) : (
                    <span aria-hidden="true">
                      {speciesIcons[pet.species]}
                    </span>
                  )}
                </div>

                <div className="dashboard-pet-details">
                  <h3>{pet.name}</h3>
                  <p>
                    {speciesLabels[pet.species]}
                    {pet.breed && ` · ${pet.breed}`}
                  </p>
                  {getAge(pet.birthDate) && (
                    <p>{getAge(pet.birthDate)}</p>
                  )}
                  <span>View passport →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Help an Animal Nearby</h2>
            <p>Recent reports from the PawLink community.</p>
          </div>

          <Link to="/reports/map" className="dashboard-text-link">
            Explore rescue map →
          </Link>
        </div>

        {reportsLoading && (
          <p className="dashboard-message">Loading recent reports...</p>
        )}

        {reportsError && (
          <p className="dashboard-message dashboard-error" role="alert">
            {reportsError}
          </p>
        )}

        {!reportsLoading && !reportsError && reports.length === 0 && (
          <div className="dashboard-empty">
            <span aria-hidden="true">🐕</span>
            <h3>No reports available</h3>
            <p>New community reports will appear here.</p>
          </div>
        )}

        {!reportsLoading && !reportsError && reports.length > 0 && (
          <div className="dashboard-reports-grid">
            {reports.map((report) => (
              <article className="dashboard-report-card" key={report.id}>
                <div className="dashboard-report-photo">
                  {report.photoUrl ? (
                    <img src={report.photoUrl} alt={report.title} />
                  ) : (
                    <span aria-hidden="true">🐾</span>
                  )}
                </div>

                <div className="dashboard-report-details">
                  <span className="dashboard-report-type">
                    {reportTypeLabels[report.type]}
                  </span>

                  <h3>{report.title}</h3>

                  <p>{report.locationText || "Location not specified"}</p>

                  <span className="dashboard-report-status">
                    {report.status.replaceAll("_", " ")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-rescue-banner">
        <div>
          <h2>Every small action can make a difference.</h2>
          <p>
            Discover animals that need help and connect with your
            local rescue community.
          </p>
        </div>

        <Link className="dashboard-button primary" to="/reports/map">
          Explore Rescue Map →
        </Link>
      </section>
    </main>
  );
}