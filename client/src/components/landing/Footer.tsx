import { Link } from "wouter";
import { SITE } from "@shared/site";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2 font-display font-bold text-lg tracking-tight mb-4">
              <img src="/favicon.svg" alt="" width={22} height={22} className="shrink-0" />
              Sunny
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consultora de péptidos con IA. Contenido educativo y de investigación.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Sunny</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <a href={`mailto:${SITE.contactEmail}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {SITE.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Aviso legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            Contenido educativo y de investigación. Sunny no ofrece consejo médico, no diagnostica ni
            prescribe. Sitio dirigido a personas mayores de 21 años. Consulta siempre a un profesional de
            la salud cualificado. Sunny no asume responsabilidad por decisiones tomadas a partir de este
            contenido.
          </p>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Sunny. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
