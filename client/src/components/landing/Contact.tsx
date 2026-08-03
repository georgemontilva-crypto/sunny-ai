import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS, CONTACT_TOPIC_VALUES, type ContactTopic } from "@shared/const.ts";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

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
    <section id="contact" className="py-24 px-4 bg-secondary/30 scroll-mt-24" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            <Mail className="w-3.5 h-3.5" />
            Get in touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Have a question?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tell us about your research interests. We'll provide educational information — not medical advice.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {status === "sent" ? (
            <div className="text-center py-16 px-8">
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
            <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-sm">
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
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rounded-lg border-border/60 focus:border-accent/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-lg border-border/60 focus:border-accent/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  What are you contacting us about?
                </label>
                <Select
                  value={form.topic}
                  onValueChange={(value) => setForm({ ...form, topic: value as ContactTopic })}
                >
                  <SelectTrigger className="rounded-lg border-border/60 focus:border-accent/50 w-full">
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
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Research goal
                </label>
                <Input
                  placeholder="E.g. recovery, longevity, body composition..."
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="rounded-lg border-border/60 focus:border-accent/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Tell us about your research interests..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="rounded-lg border-border/60 focus:border-accent/50 min-h-[140px] resize-none"
                  required
                />
              </div>

              {status === "error" && (
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <Button type="submit" disabled={status === "sending"} className="w-full font-semibold rounded-lg px-6 gap-2">
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
        </div>
      </div>
    </section>
  );
}
