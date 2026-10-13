
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { loggedOut } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "../styles/layout.css";

export default function PublicHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    dispatch(loggedOut());
    closeMenu();
    navigate("/");
  }

  return (
    <header className="public-header">
      {/* PawLink logo */}
      <Link
        className="public-logo"
        to="/"
        aria-label="PawLink home"
        onClick={closeMenu}
      >
        <span aria-hidden="true">🐾</span>
        <span>PawLink</span>
      </Link>

      {/* Mobile menu button */}
      <button
        type="button"
        className="public-menu-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="pawlink-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Navigation */}
      <nav
        id="pawlink-navigation"
        className={`public-navigation ${menuOpen ? "menu-open" : ""}`}
        aria-label="Main navigation"
      >
        {/* Mobile username */}
        {user && (
          <div className="public-mobile-greeting">
            <span>{user.name ?? user.email}</span>
          </div>
        )}

        <NavLink
          to="/"
          end
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive ? "active" : undefined
          }
        >
          Home
        </NavLink>

        {user && (
          <NavLink
            to="/dashboard"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            Dashboard
          </NavLink>
        )}

        <Link to="/#about" onClick={closeMenu}>
          About
        </Link>

        <Link to="/#features" onClick={closeMenu}>
          Features
        </Link>

        <NavLink
          to="/reports/map"
          onClick={closeMenu}
          className={({ isActive }) =>
            isActive ? "active" : undefined
          }
        >
          Reports map
        </NavLink>

        {user && (
          <NavLink
            to="/my-pets"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "active" : undefined
            }
          >
            My pets
          </NavLink>
        )}

        {/* Mobile account actions */}
        <div className="public-mobile-account">
          {user ? (
            <button
              type="button"
              className="login-link logout-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                Log in
              </Link>

              <Link to="/register" onClick={closeMenu}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Desktop account actions */}
      <div className="public-actions">
        {user ? (
          <>
            <div className="public-desktop-user">
              <span>{user.name ?? user.email}</span>
            </div>

            <span className="account-divider" aria-hidden="true">|</span>

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
