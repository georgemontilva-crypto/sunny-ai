import Navbar from "@/components/landing/Navbar";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

// Placeholder hero — Fase 4 replaces this with hero, categorías, cómo funciona,
// biblioteca de compuestos, B2B/white-label y FAQ.
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="pt-40 pb-24 px-4 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">Sunny</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Consultora de péptidos con IA. Contenido educativo y de investigación.
        </p>
      </section>
      <Contact />
      <Footer />
    </div>
  );
}
