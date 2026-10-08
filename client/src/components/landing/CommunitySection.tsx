const benefits = [
  {
    title: "Organized pet information",
    description:
      "Keep important identification and care details available in one place.",
  },
  {
    title: "Faster community response",
    description:
      "Share clear reports and locations when an animal needs assistance.",
  },
  {
    title: "Better local awareness",
    description:
      "Discover nearby reports and understand where help is currently needed.",
  },
];

export default function CommunitySection() {
  return (
    <section className="landing-community">
      <div className="landing-community-intro">
        <span>Stronger together</span>

        <h2>Small actions can make animals safer</h2>

        <p>
          PawLink connects useful pet information with
          community reporting, helping people respond more
          clearly when an animal needs attention.
        </p>

        <a href="/register">
          Join the PawLink community
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <div className="landing-community-benefits">
        {benefits.map((benefit, index) => (
          <article
            className="landing-community-benefit"
            key={benefit.title}
          >
            <span className="landing-benefit-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}