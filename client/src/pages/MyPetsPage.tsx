import { Link } from "react-router-dom";
import { useGetPetsQuery, type PetSpecies } from "../api/petsApi";
import { getErrorMessage } from "../api/getErrorMessage";
import { getAge } from "../utils/dates";
import "../styles/my-pets.css";

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

export default function MyPetsPage() {
  const { data: pets = [], isLoading, error } = useGetPetsQuery();

  return (
    <main className="my-pets-page">
      <section className="my-pets-heading">
        <div>
          <h1>My pets</h1>
          <p>Keep your pets' details and passports in one place.</p>
        </div>

        <Link to="/my-pets/new" className="add-pet-button">
          <span aria-hidden="true">+</span>
          Add pet
        </Link>
      </section>

      {isLoading && <p className="pets-message">Loading your pets...</p>}

      {error && (
        <p className="pets-message pets-error" role="alert">
          {getErrorMessage(error, "Unable to load your pets")}
        </p>
      )}

      {!isLoading && !error && pets.length === 0 && (
        <section className="pets-empty">
          <span aria-hidden="true">🐾</span>
          <h2>No pets yet</h2>
          <p>Your pets and their passports will appear here.</p>
        </section>
      )}

      {pets.length > 0 && (
        <section className="pets-grid">
          {pets.map((pet) => {
            const age = getAge(pet.birthDate);

            return (
              <Link className="pet-card" key={pet.id} to={`/my-pets/${pet.id}`}>
                <div className="pet-card-photo">
                  {pet.photoUrl ? (
                    <img src={pet.photoUrl} alt={pet.name} />
                  ) : (
                    <span aria-hidden="true">{speciesIcons[pet.species]}</span>
                  )}
                </div>

                <div className="pet-card-body">
                  <h2>{pet.name}</h2>
                  <p>
                    {speciesLabels[pet.species]}
                    {pet.breed && ` · ${pet.breed}`}
                  </p>
                  {age && <p className="pet-card-age">{age}</p>}
                  <span className="pet-card-link">View passport →</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}