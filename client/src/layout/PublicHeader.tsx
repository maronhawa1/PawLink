import {
  Link,
  NavLink,
} from "react-router-dom";
import "../styles/layout.css";

export default function PublicHeader() {
  return (
    <header className="public-header">
      <Link
        className="public-logo"
        to="/"
        aria-label="PawLink home"
      >
        <span aria-hidden="true">🐾</span>
        <span>PawLink</span>
      </Link>

      <nav
        className="public-navigation"
        aria-label="Main navigation"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "active" : undefined
          }
        >
          Home
        </NavLink>

        <Link to="/#about">About</Link>

        <Link to="/#features">Features</Link>

        <NavLink
          to="/reports/map"
          className={({ isActive }) =>
            isActive ? "active" : undefined
          }
        >
          Reports map
        </NavLink>
      </nav>

      <div className="public-actions">
        <Link className="login-link" to="/login">
          Log in
        </Link>

        <Link className="signup-link" to="/register">
          Sign up
        </Link>
      </div>
    </header>
  );
}