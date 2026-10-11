import "../styles/layout.css";

export default function Footer() {
  return (
    <footer className="public-footer">
      <div className="footer-brand">
        <span aria-hidden="true">🐾</span>
        <strong>PawLink</strong>
      </div>

      <p>Together for animal safety.</p>

      <nav aria-label="Footer navigation">
        <a href="/#about">About</a>
        <a href="/#contact">Contact</a>
        <a href="/#privacy">Privacy</a>
      </nav>

      <small>© 2026 PawLink. All rights reserved.</small>
    </footer>
  );
}