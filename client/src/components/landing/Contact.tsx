import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setStatus("sending");
    try {
      // Simulated submission - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg("Failed to send message. Please try again.");
    }
  };

  return (
    <section id="contact" className="py-24 bg-secondary/20" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tell us about your research interests. We'll provide educational guidance, no medical advice.
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
                  setForm({ name: "", email: "", message: "" });
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-sm">
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
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

