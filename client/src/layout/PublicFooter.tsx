import { useAppSelector } from "../store/hooks";

const currentYear = new Date().getFullYear();

export default function PublicFooter() {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <footer className="public-footer">
      <div className="public-footer-content">
        <div className="public-footer-brand">
          <a href="/" aria-label="PawLink home">
            <span aria-hidden="true">🐾</span>
            PawLink
          </a>

          <p>
            Digital pet information and community tools
            that help keep animals safer.
          </p>
        </div>

        <nav
          className="public-footer-links"
          aria-label="Footer navigation"
        >
          <div>
            <h2>Explore</h2>
            <a href="/">Home</a>
            <a href="/reports/map">Reports map</a>
            <a href="/reports/new">Report an animal</a>
          </div>

          <div>
            <h2>Account</h2>
            {user ? (
              <>
                <a href="/dashboard">Dashboard</a>
                <a href="/my-pets">My pets</a>
             </>
            ) : (
              <>
                <a href="/login">Log in</a>
                <a href="/register">Create account</a>
              </>
            )}
        </div>

          <div>
            <h2>Information</h2>
            <a href="/about">About PawLink</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </div>
        </nav>
      </div>

      <div className="public-footer-bottom">
        <p>
          © {currentYear} PawLink. Built for animal safety.
        </p>
      </div>
    </footer>
  );
}