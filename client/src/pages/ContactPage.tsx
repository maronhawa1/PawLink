import { useState, type FormEvent } from "react";
import "../styles/contact.css";

// Change this to the team's real email address.
const TEAM_EMAIL = "pawlink.team@example.com";
const REPO_URL = "https://github.com/maronhawa1/PawLink";

type FormValues = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const emptyForm: FormValues = { name: "", email: "", message: "" };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Please enter your name";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!values.message.trim()) {
    errors.message = "Please write a message";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters";
  }

  return errors;
}

export default function ContactPage() {
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // No backend yet: just show the confirmation message.
    setSent(true);
    setValues(emptyForm);
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <span className="contact-eyebrow">Contact</span>
        <h1>Get in touch with the PawLink team</h1>
        <p>
          Have a question, an idea or found a problem on the site?
          Send us a message and we’ll get back to you.
        </p>
      </section>

      <div className="contact-layout">
        <aside className="contact-info" aria-label="Contact details">
          <div className="contact-info-item">
            <div className="contact-info-icon" aria-hidden="true">
              ✉
            </div>
            <div>
              <h2>Email</h2>
              <a href={`mailto:${TEAM_EMAIL}`}>{TEAM_EMAIL}</a>
            </div>
          </div>

          <div className="contact-info-item">
            <div className="contact-info-icon" aria-hidden="true">
              {"</>"}
            </div>
            <div>
              <h2>GitHub</h2>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                maronhawa1/PawLink
              </a>
            </div>
          </div>
        </aside>

        <section className="contact-card" aria-labelledby="contact-form-title">
          {sent ? (
            <div className="contact-success" role="status">
              <div className="contact-success-icon" aria-hidden="true">
                ✓
              </div>
              <h2>Thanks, we’ll get back to you</h2>
              <p>Your message was received.</p>
              <button type="button" onClick={() => setSent(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 id="contact-form-title">Send us a message</h2>

              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
              />
              {errors.name && (
                <p className="contact-field-error" id="contact-name-error">
                  {errors.name}
                </p>
              )}

              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
              />
              {errors.email && (
                <p className="contact-field-error" id="contact-email-error">
                  {errors.email}
                </p>
              )}

              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                rows={6}
                maxLength={2000}
                value={values.message}
                onChange={(event) =>
                  updateField("message", event.target.value)
                }
                aria-invalid={Boolean(errors.message)}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
              />
              {errors.message && (
                <p className="contact-field-error" id="contact-message-error">
                  {errors.message}
                </p>
              )}

              <button type="submit">Send message</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
