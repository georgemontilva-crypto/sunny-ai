import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { getSlotUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Compounds", href: "#compounds" },
  { label: "Goals", href: "#goals" },
  { label: "Contact", href: "#contact" },
];

const EASE = [0.23, 1, 0.32, 1] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Locks the page underneath the full-screen mobile panel so it can't be
  // scrolled while open — same approach as ConsentGate's modal.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

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
    <>
      <nav className={cn("navbar-pill", scrolled && "is-scrolled")}>
        <div className="flex items-center justify-between h-14 pl-4 pr-2 sm:pl-5 sm:pr-3">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src={getSlotUrl("logo")} alt="Sunny" className="h-9 w-auto max-w-[9rem]" loading="lazy" />
            </motion.div>
          </Link>

          <div className="hidden min-[900px]:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="pill-link px-4 py-2 text-sm text-background/85 hover:text-background rounded-full"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/partner"
              className="pill-link px-4 py-2 text-sm text-background/85 hover:text-background rounded-full"
            >
              For brands
            </Link>
          </div>

          <div className="hidden min-[900px]:flex items-center gap-3">
            <Link
              href="/signin"
              className="pill-link px-3 py-2 text-sm text-background/85 hover:text-background rounded-full"
            >
              Sign in
            </Link>
            <Button size="sm" className="text-sm font-medium rounded-full" asChild>
              <a href="/partner#pricing">Get Started</a>
            </Button>
          </div>

          <div className="flex min-[900px]:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-background/85 hover:text-background hover:bg-background/9 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mobile-menu-panel fixed inset-0 z-40 min-[900px]:hidden flex flex-col"
          >
            <div className="h-14 shrink-0" aria-hidden="true" />
            <div className="flex-1 flex flex-col justify-center px-8 gap-2">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="mobile-menu-link text-left text-background py-2"
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.06, duration: 0.4, ease: EASE }}
              >
                <Link
                  href="/partner"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-menu-link block text-background/70 py-2"
                >
                  For brands
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (navLinks.length + 1) * 0.06, duration: 0.4, ease: EASE }}
              >
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="mobile-menu-link block text-background/70 py-2"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (navLinks.length + 2) * 0.06, duration: 0.4, ease: EASE }}
              className="px-8 pb-10 shrink-0"
            >
              <Button size="lg" className="w-full rounded-full font-semibold" asChild>
                <a href="/partner#pricing" onClick={() => setMobileOpen(false)}>
                  Get Started
                </a>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
