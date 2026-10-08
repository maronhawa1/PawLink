import heroImage from "../../assets/images/landing-hero.webp";
export default function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero-content">
        <span className="landing-eyebrow">
          Safer animals. Brighter communities.
        </span>

        <h1>Together for animal safety</h1>

        <p>
          PawLink helps pet owners and caring communities
          protect animals through digital pet passports,
          local reports and nearby support.
        </p>

        <div className="landing-hero-actions">
          <a
            className="landing-primary-button"
            href="/register"
          >
            Get started
          </a>

          <a
            className="landing-secondary-button"
            href="/reports/new"
          >
            Report an animal
          </a>
        </div>

        <ul className="landing-hero-highlights">
          <li>Digital pet records</li>
          <li>Community reports</li>
          <li>Nearby animal help</li>
        </ul>
      </div>

      <div className="landing-hero-image">
        <img
          src={heroImage}
          alt="A dog and cat representing animal safety"
        />

        <div className="landing-hero-badge">
          <strong>Community powered</strong>
          <span>Helping animals together</span>
        </div>
      </div>
    </section>
  );
}