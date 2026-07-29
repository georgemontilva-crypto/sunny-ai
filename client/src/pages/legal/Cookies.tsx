import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Última actualización: 29 de julio de 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Política de Cookies</h1>
          <p className="text-muted-foreground leading-relaxed">
            Sunny es un sitio estático. No usamos cookies de seguimiento publicitario ni de terceros.
          </p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Qué usamos</h2>
            <p>
              Este sitio no coloca cookies propias. No tenemos sistema de login, carritos de compra ni
              seguimiento publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Almacenamiento local</h2>
            <p>
              Tu navegador puede guardar preferencias locales (como el estado de un banner ya cerrado)
              mediante <code>localStorage</code>. Esta información se guarda solo en tu dispositivo y nunca
              se envía a nuestros servidores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cambios a esta política</h2>
            <p>Si en el futuro incorporamos analítica o cookies de terceros, actualizaremos esta página.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Contacto</h2>
            <p>
              Para preguntas, escríbenos desde nuestra{" "}
              <Link href="/contact" className="text-primary hover:underline">página de contacto</Link>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Términos</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link href="/legal/disclaimer" className="hover:text-foreground transition-colors">Aviso legal</Link>
        </div>
      </div>
    </div>
  );
}
