import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS, CONTACT_TOPIC_VALUES, type ContactTopic } from "@shared/const.ts";
import { SITE } from "@shared/site.ts";
import { ArrowRight, Send, CheckCircle, AlertCircle } from "lucide-react";
import LegalNotice from "@/components/landing/LegalNotice";

type Status = "idle" | "sending" | "sent" | "error";

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

const FIELD_LABEL = "font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground";
const FIELD_INPUT = "rounded-lg border-border/60 focus:border-accent focus-visible:ring-accent/18";

// /partner's CTAs link here as /contact?plan=standard|whitelabel — anything
// else (missing, or an unrecognized value) preselects "General question".
function topicFromPlanParam(search: string): ContactTopic {
  const plan = new URLSearchParams(search).get("plan");
  return (CONTACT_TOPIC_VALUES as readonly string[]).includes(plan ?? "") ? (plan as ContactTopic) : "general";
}

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const search = useSearch();

  const [form, setForm] = useState({ name: "", email: "", goal: "", message: "", website: "", topic: topicFromPlanParam(search) });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: real visitors never fill this hidden field.
    if (form.website) return;

    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!CONTACT_ENDPOINT) {
      setStatus("error");
      setErrorMsg("The contact form isn't configured yet. Please email us directly.");
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
          topic: form.topic,
          message: form.message,
          website: form.website || undefined,
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Failed to send message. Please try again.");
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-secondary/34 scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <div
          className="grid grid-cols-[.85fr_1.15fr] max-[860px]:grid-cols-1 items-start"
          style={{ gap: "clamp(30px, 5vw, 64px)" }}
        >
          {/* LEFT — eyebrow, headline, context, contact data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-[11px] tracking-[.14em] uppercase text-muted-foreground mb-3.5 block">
              Get in touch
            </span>
            <h2 className="text-[clamp(32px,4.2vw,50px)] font-semibold leading-[1.03] mb-[18px]">
              Have a <span className="text-accent">question?</span>
            </h2>
            <p className="text-muted-foreground max-w-[36ch]">
              Tell us about your research interests. We'll provide educational information — not medical
              advice.
            </p>

            <div className="mt-7 pt-5 border-t border-border text-sm">
              <div className="py-[7px] text-muted-foreground">
                Email ·{" "}
                <a href={`mailto:${SITE.contactEmail}`} className="text-foreground font-medium hover:text-accent">
                  {SITE.contactEmail}
                </a>
              </div>
              <div className="py-[7px] text-muted-foreground">
                Educational research content. Not medical advice. For adults 21+.
              </div>
            </div>

            <p className="mt-[22px] text-sm">
              Run a clinic or brand?{" "}
              <Link href="/partner" className="text-accent font-medium hover:underline inline-flex items-center gap-1">
                See how Sunny works for you
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </motion.div>

          {/* RIGHT — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {status === "sent" ? (
              <div className="bg-card border border-border/50 rounded-[20px] p-8 text-center py-16 shadow-[0_24px_54px_-34px_rgba(120,80,20,0.4)]">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8 text-accent" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3">Message sent</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                  Thanks for reaching out. We'll get back to you soon at <strong>{form.email}</strong>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatus("idle");
                    setForm({ name: "", email: "", goal: "", message: "", website: "", topic: "general" });
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-card border border-border/50 rounded-[20px] p-8 space-y-5 shadow-[0_24px_54px_-34px_rgba(120,80,20,0.4)]"
              >
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
                    <label className={FIELD_LABEL}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={FIELD_INPUT}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={FIELD_LABEL}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={FIELD_INPUT}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={FIELD_LABEL}>What are you contacting us about?</label>
                  <Select
                    value={form.topic}
                    onValueChange={(value) => setForm({ ...form, topic: value as ContactTopic })}
                  >
                    <SelectTrigger className={`${FIELD_INPUT} w-full`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TOPICS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className={FIELD_LABEL}>Research goal</label>
                  <Input
                    placeholder="E.g. recovery, longevity, body composition..."
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className={FIELD_INPUT}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={FIELD_LABEL}>
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Tell us about your research interests..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${FIELD_INPUT} min-h-[140px] resize-none`}
                    required
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full font-semibold rounded-full px-6 gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Educational summaries of published research. Not medical advice.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl" style={{ marginTop: "clamp(40px, 6vw, 64px)" }}>
        <LegalNotice />
      </div>
    </section>
  );
}
