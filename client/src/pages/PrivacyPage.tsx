import { Link } from "react-router-dom";
import "../styles/privacy.css";

const storedData = [
  {
    title: "Your name and email",
    description:
      "Used to create your account and sign you in. Your name is shown next to reports, updates and help offers you post. Your email is never shown to other users.",
  },
  {
    title: "Your pets",
    description:
      "The details you add to a pet passport, such as name, species, breed, birth date, microchip number and vaccination records.",
  },
  {
    title: "Your reports",
    description:
      "The animal reports you create, including the description, animal type, status and the location you choose.",
  },
  {
    title: "Photos",
    description:
      "Pet photos and report photos you upload. Only JPEG, PNG and WebP images up to 5 MB are accepted.",
  },
];

const rules = [
  {
    icon: "🔒",
    title: "Passwords are hashed",
    description:
      "Your password is hashed with bcrypt before it is saved. It is never stored as plain text, and nobody on the team can read it.",
  },
  {
    icon: "🐾",
    title: "Pet details are private",
    description:
      "Your pets and their vaccination records are visible only to you. Other users cannot open, edit or delete them.",
  },
  {
    icon: "📍",
    title: "Reports are public",
    description:
      "Animal reports, with their photo and location, are visible to everyone so the community can find the animal and help.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <section className="privacy-hero">
        <span className="privacy-eyebrow">Privacy</span>
        <h1>How PawLink handles your data</h1>
        <p>
          We only keep the information PawLink needs to work. This
          page explains what we store, what stays private and what
          is shared with the community.
        </p>
      </section>

      <section
        className="privacy-section"
        aria-labelledby="privacy-stored"
      >
        <div className="privacy-section-heading">
          <span>What we store</span>
          <h2 id="privacy-stored">The data in your account</h2>
        </div>

        <ul className="privacy-data-list">
          {storedData.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="privacy-section"
        aria-labelledby="privacy-rules"
      >
        <div className="privacy-section-heading">
          <span>How it is protected</span>
          <h2 id="privacy-rules">What is private and what is public</h2>
        </div>

        <div className="privacy-rules-grid">
          {rules.map((rule) => (
            <article className="privacy-card" key={rule.title}>
              <div className="privacy-card-icon" aria-hidden="true">
                {rule.icon}
              </div>
              <h3>{rule.title}</h3>
              <p>{rule.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-note">
        <h2>Before you post a report</h2>
        <p>
          Because reports are public, avoid adding personal details
          such as your phone number or home address in the
          description. You can change a report’s status or close it
          at any time.
        </p>
        <Link to="/reports/new">Report an animal</Link>
      </section>
    </main>
  );
}
