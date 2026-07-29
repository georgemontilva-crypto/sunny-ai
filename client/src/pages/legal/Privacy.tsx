import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Última actualización: 29 de julio de 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Política de Privacidad</h1>
          <p className="text-muted-foreground leading-relaxed">
            En Sunny nos importa cómo se trata tu información. Esta política explica qué datos recogemos
            a través de este sitio y cómo los usamos.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Qué información recogemos</h2>
            <p>
              Solo recogemos los datos que envías voluntariamente a través del formulario de contacto:
              nombre, correo electrónico, objetivo de investigación y el mensaje que escribas. No usamos
              cuentas de usuario ni sistemas de login: este sitio es informativo y no requiere registro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Cómo usamos tu información</h2>
            <p>
              Usamos los datos del formulario únicamente para responder a tu consulta. No vendemos ni
              compartimos tu información con terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Dónde se procesa el formulario</h2>
            <p>
              El formulario de contacto envía tu mensaje a un servicio externo que gestiona el envío de
              correo. No almacenamos tu mensaje en una base de datos propia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Tus derechos</h2>
            <p>
              Puedes solicitar en cualquier momento que eliminemos la información que nos hayas enviado,
              escribiéndonos desde la página de contacto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cambios a esta política</h2>
            <p>Podemos actualizar esta política ocasionalmente. Los cambios entran en vigor al publicarse aquí.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contacto</h2>
            <p>
              Para preguntas sobre privacidad, escríbenos desde nuestra{" "}
              <Link href="/contact" className="text-primary hover:underline">página de contacto</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Términos</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Aviso legal</Link>
        </div>
      </div>
    </div>
  );
}
