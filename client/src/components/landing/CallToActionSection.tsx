export default function CallToActionSection() {
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
        <a
          className="landing-cta-primary"
          href="/register"
        >
          Create an account
        </a>

        <a
          className="landing-cta-secondary"
          href="/reports/new"
        >
          Report an animal
        </a>
      </div>
    </section>
  );
}