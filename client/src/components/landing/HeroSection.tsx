import heroImage from "../../assets/images/landing-hero.webp";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

export default function HeroSection() {
  const user = useAppSelector((state) => state.auth.user);
  
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
          <Link
            className="landing-primary-button"
            to={user ? "/dashboard" : "/register"}
          >
            {user ? "Go to Dashboard" : "Get started"}
          </Link>

          <Link
            className="landing-secondary-button"
            to="/reports/new"
          >
            Report an animal
          </Link>
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