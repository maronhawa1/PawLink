import { Link, NavLink, useNavigate } from "react-router-dom";
import { loggedOut } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "../styles/layout.css";

export default function PublicHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(loggedOut());
    navigate("/");
  }

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

        {user && (
          <NavLink
            to="/my-pets"
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            My pets
          </NavLink>
        )}
      </nav>

      <div className="public-actions">
        {user ? (
          <>
            <span className="header-greeting">
              Hi, {user.name ?? user.email}
            </span>

            <button
              type="button"
              className="login-link logout-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="login-link" to="/login">
              Log in
            </Link>

            <Link className="signup-link" to="/register">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}