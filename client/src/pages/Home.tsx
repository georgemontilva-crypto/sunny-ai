import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Categories from "@/components/landing/Categories";
import HowItWorks from "@/components/landing/HowItWorks";
import CompoundLibrary from "@/components/landing/CompoundLibrary";
import B2BWhiteLabel from "@/components/landing/B2BWhiteLabel";
import FAQ from "@/components/landing/FAQ";
import Contact from "@/components/landing/Contact";
import LegalNotice from "@/components/landing/LegalNotice";
import Footer from "@/components/landing/Footer";
import SchemaMarkup from "@/components/landing/SchemaMarkup";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SchemaMarkup />
      <Navbar />
      <Hero />
      <Categories />
      <HowItWorks />
      <CompoundLibrary />
      <B2BWhiteLabel />
      <FAQ />
      <Contact />
      <LegalNotice />
      <Footer />
    </div>
  );
}
