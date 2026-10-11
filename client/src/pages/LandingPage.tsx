import CallToActionSection from "../components/landing/CallToActionSection";
import CommunitySection from "../components/landing/CommunitySection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HeroSection from "../components/landing/HeroSection";
import ReportsPreviewSection from "../components/landing/ReportsPreviewSection";
import "../styles/landing.css";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <HeroSection />
      <FeaturesSection />
      <ReportsPreviewSection />
      <CommunitySection />
      <CallToActionSection />
    </main>
  );
}