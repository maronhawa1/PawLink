
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/register.css";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001";

type RegisterResponse = {
  message?: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Registration failed.");
      }

      navigate("/login", { replace: true });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-visual">
        <div className="register-visual-copy">
          <h1>A safer community starts here.</h1>
          <p>
            Happier pets.
            <br />
            Stronger neighbors.
            <br />
            A kinder tomorrow.
          </p>
        </div>
      </section>

      <section className="register-content">
        <form className="register-card" onSubmit={handleSubmit}>
          <h2>Create your account</h2>
          <p className="register-description">
            Join PawLink and help build a safer,
            more connected community for pets.
          </p>

          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="register-show-password"
            onClick={() => setShowPassword(!showPassword)}
            >
            {showPassword ? "Hide password" : "Show password"}
          </button>

          {error && (
            <p className="register-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </button>

          <p className="register-login">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
