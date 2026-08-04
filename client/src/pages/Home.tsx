import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Questions from "@/components/landing/Questions";
import Compounds from "@/components/landing/Compounds";
import MeetSunny from "@/components/landing/MeetSunny";
import HowItWorks from "@/components/landing/HowItWorks";
import ChatDemo from "@/components/landing/ChatDemo";
import Goals from "@/components/landing/Goals";
import FAQ from "@/components/landing/FAQ";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";
import SchemaMarkup from "@/components/landing/SchemaMarkup";

// Rhythm (per sunny-home-FINAL.html): hero(DARK) -> questions(light) ->
// compounds(DARK) -> meetSunny(arena) -> howItWorks(light) -> chat(DARK) ->
// goals(light) -> faq(light) -> contact(arena, with a dark legal-notice band
// folded inside it) -> footer(DARK) — no two adjacent sections share the
// same background weight. LegalNotice is no longer mounted here on its own;
// Contact.tsx renders it internally, below the form. B2BWhiteLabel used to
// sit here too; it's gone from the home (duplicated /partner's message) but
// the component itself still lives in the repo for /partner to reuse — see
// Contact's "Run a clinic or brand?" line and Footer's "For brands" link for
// where that path now lives on this page instead.
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SchemaMarkup />
      <Navbar />
      <Hero />
      <Questions />
      <Compounds />
      <MeetSunny />
      <HowItWorks />
      <ChatDemo />
      <Goals />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
