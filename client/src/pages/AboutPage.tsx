import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import "../styles/about.css";

const audiences = [
  {
    icon: "🐾",
    title: "Pet owners",
    description:
      "Keep your pet’s identity details, photo and vaccination history in one digital passport you can open any time.",
  },
  {
    icon: "♥",
    title: "People who find animals in need",
    description:
      "Found an injured, lost or at-risk animal? Report it with a photo and location so people nearby can step in and help.",
  },
];

const features = [
  {
    icon: "🪪",
    title: "Pet passport",
    description:
      "A digital profile for each pet with its name, species, breed, photo and other identifying details.",
  },
  {
    icon: "💉",
    title: "Vaccination tracking",
    description:
      "Record every vaccination with its date and next due date, so nothing important is missed.",
  },
  {
    icon: "⌖",
    title: "Reports map",
    description:
      "See animal reports on an interactive map and filter them by type and status to find where help is needed.",
  },
  {
    icon: "🤝",
    title: "Offering help",
    description:
      "Offer help on a report, follow its progress updates and see when the reporter marks the case as resolved.",
  },
];

const team = ["Maron", "Misk", "Ward"];

export default function AboutPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <main className="about-page">
      <section className="about-hero">
        <span className="about-eyebrow">About PawLink</span>

        <h1>Connecting people who care about animals</h1>

        <p>
          PawLink is a web platform that brings digital pet passports and
          community animal help together in one place. It helps owners keep
          their pets’ information organized, and helps anyone who finds an
          animal in need get it the help it deserves.
        </p>
      </section>

      <section className="about-section" aria-labelledby="about-who">
        <div className="about-section-heading">
          <span>Who it helps</span>
          <h2 id="about-who">Built for two kinds of people</h2>
        </div>

        <div className="about-audience-grid">
          {audiences.map((audience) => (
            <article className="about-card" key={audience.title}>
              <div className="about-card-icon" aria-hidden="true">
                {audience.icon}
              </div>
              <h3>{audience.title}</h3>
              <p>{audience.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" aria-labelledby="about-features">
        <div className="about-section-heading">
          <span>Main features</span>
          <h2 id="about-features">What you can do with PawLink</h2>
        </div>

        <div className="about-feature-grid">
          {features.map((feature) => (
            <article className="about-card" key={feature.title}>
              <div className="about-card-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="about-section about-team"
        aria-labelledby="about-team"
      >
        <div className="about-section-heading">
          <span>The team</span>
          <h2 id="about-team">The people behind PawLink</h2>
          <p>
            PawLink was designed and built as a final project by a team of three
            developers.
          </p>
        </div>

        <ul className="about-team-list">
          {team.map((name) => (
            <li className="about-team-member" key={name}>
              <span className="about-team-avatar" aria-hidden="true">
                {name.charAt(0)}
              </span>
              <strong>{name}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-cta">
        <h2>Ready to get started?</h2>
        <p>Add your pet or check where animals need help near you.</p>

        <div className="about-cta-actions">
          <Link
            className="about-primary-button"
            to={user ? "/dashboard" : "/register"}
          >
            {user ? "Go to Dashboard" : "Create an account"}
          </Link>
          <Link className="about-secondary-button" to="/reports/map">
            Open reports map
          </Link>
        </div>
      </section>
    </main>
  );
}
