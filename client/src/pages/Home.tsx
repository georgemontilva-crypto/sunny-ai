import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Questions from "@/components/landing/Questions";
import HowItWorks from "@/components/landing/HowItWorks";
import MeetSunny from "@/components/landing/MeetSunny";
import ChatDemo from "@/components/landing/ChatDemo";
import Compounds from "@/components/landing/Compounds";
import Goals from "@/components/landing/Goals";
import B2BWhiteLabel from "@/components/landing/B2BWhiteLabel";
import FAQ from "@/components/landing/FAQ";
import Contact from "@/components/landing/Contact";
import LegalNotice from "@/components/landing/LegalNotice";
import Footer from "@/components/landing/Footer";
import SchemaMarkup from "@/components/landing/SchemaMarkup";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SchemaMarkup />
      <Navbar />
      <Hero />
      <Questions />
      <HowItWorks />
      <MeetSunny />
      <ChatDemo />
      <Compounds />
      <Goals />
      <B2BWhiteLabel />
      <FAQ />
      <Contact />
      <LegalNotice />
      <Footer />
    </div>
  );
}
