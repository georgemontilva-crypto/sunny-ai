import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, AlertCircle, User } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [form, setForm] = useState({ name: "", email: "", goal: "", message: "", website: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: real visitors never fill this hidden field.
    if (form.website) return;

    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      setErrorMsg("Completa nombre, correo y mensaje antes de enviar.");
      return;
    }
    if (!CONTACT_ENDPOINT) {
      setStatus("error");
      setErrorMsg("El formulario no está configurado todavía. Escríbenos directamente por correo.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          goal: form.goal || undefined,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos por correo.");
    }
  };

  return (
    <section id="contact" className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Mail className="w-3.5 h-3.5" />
            Cuéntanos tu objetivo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Habla con Sunny</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escríbenos sobre tu objetivo de investigación. Te respondemos con información educativa, sin
            diagnóstico ni prescripción.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {status === "sent" ? (
            <div className="text-center py-16 px-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-3">Mensaje enviado</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                Gracias por escribirnos. Te responderemos a <strong>{form.email}</strong> pronto.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("idle");
                  setForm({ name: "", email: "", goal: "", message: "", website: "" });
                }}
              >
                Enviar otro mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-3xl p-8 space-y-5 shadow-sm">
              {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tu nombre"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-9 rounded-xl border-border/60 focus:border-primary/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Correo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="tu@correo.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-9 rounded-xl border-border/60 focus:border-primary/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Objetivo de investigación
                </label>
                <Input
                  placeholder="Ej. recuperación articular, longevidad, composición corporal..."
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="rounded-xl border-border/60 focus:border-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Cuéntanos qué estás investigando..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="rounded-xl border-border/60 focus:border-primary/50 min-h-[140px] resize-none"
                  required
                />
              </div>

              {status === "error" && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 pt-1">
                <Button type="submit" disabled={status === "sending"} className="w-full font-semibold rounded-xl px-6 gap-2">
                  {status === "sending" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
