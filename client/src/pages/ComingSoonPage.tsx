import "../styles/coming-soon.css";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <main className="coming-soon-page">
      <section className="coming-soon-card">
        <span>Coming soon</span>

        <h1>{title}</h1>

        <p>{description}</p>

        <a href="/">Return to home</a>
      </section>
    </main>
  );
}