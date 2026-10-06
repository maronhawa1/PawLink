import "../styles/layout.css";

export default function PublicHeader() {
  return (
    <header className="public-header">
      <a className="public-logo" href="/">
        <span aria-hidden="true">🐾</span>
        <span>PawLink</span>
      </a>

      <nav className="public-navigation" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/#about">About</a>
        <a href="/#features">Features</a>
      </nav>

      <div className="public-actions">
        <span>New to PawLink?</span>
        <a className="signup-link" href="/register">
          Sign up
        </a>
      </div>
    </header>
  );
}