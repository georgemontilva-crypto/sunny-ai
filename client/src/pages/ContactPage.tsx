import Navbar from "@/components/landing/Navbar";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-16" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-8 pb-0">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <a href="/" className="hover:text-foreground transition-colors">Inicio</a>
          <span>/</span>
          <span className="text-foreground font-medium">Contacto</span>
        </nav>
      </div>
      <Contact />
      <Footer />
    </div>
  );
}
