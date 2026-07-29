import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

// Helper: navigate to a hash section — works from any page
function useAnchorNav() {
  const [, navigate] = useLocation();
  return (href: string, closeMobile?: () => void) => {
    if (closeMobile) closeMobile();
    if (href.startsWith("#")) {
      if (window.location.pathname === "/") {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
        setTimeout(() => {
          document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
        }, 400);
      }
    } else {
      navigate(href);
    }
  };
}

type NavLink = { label: string; href: string };

const navLinks: NavLink[] = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Compuestos", href: "#biblioteca" },
  { label: "White-Label", href: "#white-label" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const goTo = useAnchorNav();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <motion.span
              className="flex items-center gap-2 cursor-pointer font-display font-bold text-lg tracking-tight"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src="/favicon.svg" alt="" width={28} height={28} className="shrink-0" />
              Sunny
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/50"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.href}
                  onClick={() => goTo(link.href)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-accent/50"
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact">
              <Button size="sm" className="text-sm font-medium">
                Hablar con Sunny
              </Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 overflow-hidden"
          >
            <div className="container px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobile}
                    className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.href}
                    onClick={() => goTo(link.href, closeMobile)}
                    className="px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    {link.label}
                  </button>
                )
              )}
              <div className="pt-3">
                <Link href="/contact" onClick={closeMobile}>
                  <Button size="sm" className="w-full">Hablar con Sunny</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
