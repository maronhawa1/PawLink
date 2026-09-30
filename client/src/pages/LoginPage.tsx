import { useState, type FormEvent } from "react";
import "../styles/login.css";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001";

type LoginResponse = {
  message?: string;
  token?: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.token) {
        throw new Error(data.message ?? "Login failed");
      }

      localStorage.setItem("pawlink_token", data.token);

      // זמני — בהמשך נעביר לדף My Pets דרך React Router
      window.location.assign("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to log in",
      );
    } finally {
      setIsLoading(false);
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
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </button>

          <p className="login-register">
            New to PawLink? <a href="/register">Sign up</a>
          </p>
        </form>
      </section>
    </main>
  );
}