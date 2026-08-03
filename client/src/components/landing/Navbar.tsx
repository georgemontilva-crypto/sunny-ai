import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { getSlotUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Compounds", href: "#compounds" },
  { label: "Goals", href: "#goals" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // These sections (how-it-works, compounds, goals, contact) only exist on
  // Home — from any other route (e.g. /partner) there's nothing local to
  // scroll to, so navigate there instead and let the browser's native
  // anchor scroll (same mechanism as the "Get Started" /partner#pricing
  // link) land on the section once Home renders.
  const scrollToSection = (href: string) => {
    setMobileOpen(false);
    if (location !== "/") {
      window.location.href = `/${href}`;
      return;
    }
    const id = href.slice(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src={getSlotUrl("logo")} alt="Sunny" className="h-12 w-auto max-w-xs" loading="lazy" />
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/10"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/partner"
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/10"
            >
              For brands
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Sign in
            </Link>
            <Button size="sm" className="text-sm font-medium" asChild>
              <a href="/partner#pricing">Get Started</a>
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/10"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 overflow-hidden"
          >
            <div className="container px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/10 transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
              <Link
                href="/partner"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/10 transition-colors text-left"
              >
                For brands
              </Link>
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/10 transition-colors text-left"
              >
                Sign in
              </Link>
              <div className="pt-3">
                <Button size="sm" className="w-full" asChild>
                  <a href="/partner#pricing" onClick={() => setMobileOpen(false)}>Get Started</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
