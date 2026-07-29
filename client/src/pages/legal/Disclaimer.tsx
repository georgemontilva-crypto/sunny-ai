import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">Última actualización: 29 de julio de 2026</p>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Aviso legal</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            Todo el contenido publicado por Sunny —incluyendo la biblioteca de compuestos, el blog y las
            respuestas generadas a través de este sitio— tiene <strong>fines exclusivamente educativos y de
            investigación</strong>.
          </p>
          <p>
            Sunny <strong>no ofrece consejo médico</strong>, no diagnostica ni prescribe ningún tratamiento,
            compuesto ni protocolo. La información aquí presentada resume literatura científica disponible y
            no debe interpretarse como una recomendación de uso.
          </p>
          <p>
            Este sitio está dirigido a <strong>personas mayores de 21 años</strong>. El acceso o uso por parte
            de menores de esa edad no está autorizado.
          </p>
          <p>
            Antes de tomar cualquier decisión relacionada con tu salud, consulta siempre a un{" "}
            <strong>profesional de la salud cualificado</strong>. Ninguna decisión que tomes a partir del
            contenido de este sitio genera responsabilidad para Sunny.
          </p>
          <p>
            Sunny no vende ni distribuye compuestos. Cualquier decisión de adquirir, usar o investigar con
            un compuesto mencionado en este sitio es responsabilidad exclusiva del usuario.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Términos</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  );
}
