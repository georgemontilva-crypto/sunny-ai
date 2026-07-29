import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Última actualización: 29 de julio de 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Términos de Servicio</h1>
          <p className="text-muted-foreground leading-relaxed">
            Estos Términos de Servicio rigen el acceso y uso del sitio web de Sunny ("el Servicio"). Al usar
            este sitio aceptas estos términos. Si no estás de acuerdo, por favor no continúes usando el Servicio.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Naturaleza del Servicio</h2>
            <p>
              Sunny es un sitio informativo que publica contenido educativo y de investigación sobre péptidos.
              No vendemos compuestos, no operamos una tienda en línea ni prestamos servicios médicos. El
              contenido publicado (artículos, biblioteca de compuestos, respuestas a formularios) tiene un
              propósito exclusivamente educativo y de investigación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Uso permitido</h2>
            <p>
              Puedes usar este sitio para informarte. No debes usarlo para obtener indicaciones de dosificación,
              diagnóstico o tratamiento de ninguna condición médica, ni para sustituir el criterio de un
              profesional de la salud cualificado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Edad mínima</h2>
            <p>
              El acceso a este sitio y el uso del formulario de contacto están destinados a personas
              mayores de 21 años. Si tienes menos de 21 años, te pedimos que no envíes información a través
              de nuestros formularios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Sin consejo médico</h2>
            <p>
              Nada en este sitio constituye consejo médico. Sunny no diagnostica, trata, cura ni previene
              ninguna enfermedad. Consulta siempre a un profesional de la salud cualificado antes de tomar
              cualquier decisión relacionada con tu salud.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitación de responsabilidad</h2>
            <p>
              Sunny no asume responsabilidad por decisiones que tomes basándote en el contenido de este sitio.
              El uso de la información publicada aquí es bajo tu propio riesgo y criterio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Propiedad intelectual</h2>
            <p>
              El contenido, diseño y marca de Sunny están protegidos por derechos de autor. No está permitido
              reproducir el contenido de este sitio sin autorización previa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cambios a estos términos</h2>
            <p>
              Podemos actualizar estos términos ocasionalmente. Los cambios entran en vigor al publicarse en
              esta página.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, escríbenos desde nuestra{" "}
              <Link href="/contact" className="text-primary hover:underline">página de contacto</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Aviso legal</Link>
        </div>
      </div>
    </div>
  );
}
