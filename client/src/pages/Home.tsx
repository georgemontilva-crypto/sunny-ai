import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Questions from "@/components/landing/Questions";
import HowItWorks from "@/components/landing/HowItWorks";
import MeetSunny from "@/components/landing/MeetSunny";
import ChatDemo from "@/components/landing/ChatDemo";
import Compounds from "@/components/landing/Compounds";
import Goals from "@/components/landing/Goals";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <Questions />
      <HowItWorks />
      <MeetSunny />
      <ChatDemo />
      <Compounds />
      <Goals />
      <Contact />
      <Footer />
    </div>
  );
}
