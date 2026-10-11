import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../api/authApi";
import { getErrorMessage } from "../api/getErrorMessage";
import { loggedIn } from "../store/authSlice";
import { useAppDispatch } from "../store/hooks";
import "../styles/login.css";

type LoginLocationState = {
  registered?: boolean;
  email?: string;
} | null;

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const state = location.state as LoginLocationState;
  const registered = state?.registered === true;

  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const data = await login({ email, password }).unwrap();
      dispatch(loggedIn({ token: data.token, user: data.user }));
      navigate("/", { replace: true });
    } catch {
      return;
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-visual-copy">
          <h1>Together for animal safety</h1>
          <p>Safer pets. Kinder communities. A brighter tomorrow.</p>
        </div>
      </section>

      <section className="login-content">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p>Log in to continue to PawLink.</p>

          {registered && (
            <p className="login-success" role="status">
              Your account was created. You can log in now.
            </p>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <p className="login-error" role="alert">
              {getErrorMessage(error, "Login failed")}
            </p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </button>

          <p className="login-register">
            New to PawLink? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </section>
    </main>
  );
}