import { Link } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";

export default function CallToActionSection() {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <section className="landing-cta">
      <div>
        <span>Ready to get started?</span>

        <h2>Help create a safer community for animals</h2>

        <p>
          Create a digital passport for your pet or report
          an animal that needs attention.
        </p>
      </div>

      <div className="landing-cta-actions">
        <Link
          className="landing-cta-primary"
          to={user ? "/dashboard" : "/register"}
        >
          {user ? "Go to Dashboard" : "Create an account"}
        </Link>

        <Link
          className="landing-cta-secondary"
          to="/reports/new"
        >
          Report an animal
        </Link>
      </div>
    </section>
  );
}