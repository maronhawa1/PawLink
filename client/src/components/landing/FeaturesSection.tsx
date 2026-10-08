const features = [
  {
    icon: "🐾",
    title: "Digital Pet Passport",
    description:
      "Keep your pet’s identification, vaccinations and important medical information in one organized place.",
    link: "/pets",
    linkText: "Explore pet passports",
  },
  {
    icon: "!",
    title: "Report an Animal",
    description:
      "Quickly report a lost, injured, found or at-risk animal and share its location with the community.",
    link: "/reports/new",
    linkText: "Create a report",
  },
  {
    icon: "⌖",
    title: "Find Help Nearby",
    description:
      "View nearby animal reports on an interactive map and discover where help is currently needed.",
    link: "/reports/map",
    linkText: "Open reports map",
  },
];

export default function FeaturesSection() {
  return (
<section
  id="features"
  className="landing-features"
>
      <div className="landing-section-heading">
        <span>How PawLink helps</span>
        <h2>Everything needed to protect animals</h2>
        <p>
          Simple tools for pet owners and community members
          who want to keep animals safe.
        </p>
      </div>

      <div className="landing-feature-grid">
        {features.map((feature) => (
          <article
            className="landing-feature-card"
            key={feature.title}
          >
            <div className="landing-feature-icon">
              {feature.icon}
            </div>

            <h3>{feature.title}</h3>

            <p>{feature.description}</p>

            <a href={feature.link}>
              {feature.linkText}
              <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}