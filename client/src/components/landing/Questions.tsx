import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHead from "@/components/landing/SectionHead";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getSlotUrl } from "@/lib/media";
import { getSetting } from "@/lib/settings";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface QuestionCard {
  metric: string;
  label: string;
  question: string;
  category: string;
  image: string;
  hiRes: boolean;
}

// `image` doubles as this card's stable id for ordering — it already
// matches its media slot (card-<image>) one-to-one, see
// server/mediaCatalog.ts.
const DEFAULT_QUESTIONS: QuestionCard[] = [
  {
    metric: "Sleep quality",
    label: "area of interest",
    question: "What does the literature say about peptides studied for sleep quality?",
    category: "Sleep",
    image: "sleep-quality",
    hiRes: false,
  },
  {
    metric: "Body composition",
    label: "area of interest",
    question: "Which compounds appear in body composition research, and in what models?",
    category: "Fat Loss",
    image: "body-composition",
    hiRes: false,
  },
  {
    metric: "Tissue repair",
    label: "area of interest",
    question: "How is tissue repair studied, and where does the evidence stop?",
    category: "Recovery",
    image: "tissue-repair",
    hiRes: false,
  },
  {
    metric: "Cognitive focus",
    label: "area of interest",
    question: "What has been published on peptides and cognitive focus?",
    category: "Focus",
    image: "cognitive-focus",
    hiRes: true,
  },
  {
    metric: "Hormonal balance",
    label: "area of interest",
    question: "How does the research approach hormonal pathways?",
    category: "Libido",
    image: "hormonal-balance",
    hiRes: true,
  },
  {
    metric: "Skin & hair health",
    label: "area of interest",
    question: "What is documented about peptides in skin and hair research?",
    category: "Skin & Hair",
    image: "skin-hair",
    hiRes: true,
  },
];

const ORDER_SETTING_KEY = "section_order_questions";

// Unknown/stale ids (a card renamed or removed) are dropped, and any card
// missing from `ids` is appended after the known ones in its default
// position — a leftover old id in settings can never break the section.
function applyOrder(ids: string[]): QuestionCard[] {
  const byId = new Map(DEFAULT_QUESTIONS.map((q) => [q.image, q]));
  const known = ids.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
  const missing = DEFAULT_QUESTIONS.filter((q) => !ids.includes(q.image));
  return [...known, ...missing];
}

function readSavedOrder(): string[] {
  try {
    const parsed = JSON.parse(getSetting(ORDER_SETTING_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export default function Questions() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const savedOrder = readSavedOrder();
  const baseCards = savedOrder.length ? applyOrder(savedOrder) : DEFAULT_QUESTIONS;

  // Edit-mode state defaults off and renders identical markup on the server
  // and the first client pass either way, so declaring it here (rather than
  // only inside the admin-gated controls below) can't cause a hydration
  // mismatch — it just never turns on until an admin clicks the button.
  const [editMode, setEditMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateSetting = trpc.settings.update.useMutation();

  const cards = editMode ? applyOrder(draftOrder) : baseCards;

  function beginEdit() {
    setDraftOrder(baseCards.map((q) => q.image));
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setDragId(null);
    setOverId(null);
  }

  function moveDraft(overImage: string) {
    if (!dragId || dragId === overImage) return;
    setDraftOrder((prev) => {
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(overImage);
      if (from === -1 || to === -1) return prev;
      const next = prev.slice();
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
  }

  async function saveOrder() {
    setSaving(true);
    try {
      await updateSetting.mutateAsync({ key: ORDER_SETTING_KEY, value: JSON.stringify(draftOrder) });
      toast.success("Layout saved — publishing now.");
      setEditMode(false);
      setDragId(null);
      setOverId(null);
    } catch {
      toast.error("Couldn't save the new order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="py-24 px-4 bg-background" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <SectionHead
          eyebrow="Real questions"
          title="Real questions people"
          accentTitle="ask"
          note="Science-first explanations based on what you are exploring."
        />

        <div className="grid grid-cols-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 gap-5 items-start">
          {cards.map((q, i) => {
            const isDropTarget = editMode && overId === q.image && dragId !== q.image;
            return (
              <motion.div
                key={q.image}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              >
                {/* IMPORTANT: this must stay a <div> (display:block) — a
                    <span> here silently drops the .txt block's vertical
                    padding and the copy ends up glued to the card edge. */}
                <div
                  draggable={editMode}
                  onDragStart={editMode ? () => setDragId(q.image) : undefined}
                  onDragOver={
                    editMode
                      ? (e) => {
                          e.preventDefault();
                          setOverId(q.image);
                        }
                      : undefined
                  }
                  onDrop={
                    editMode
                      ? (e) => {
                          e.preventDefault();
                          moveDraft(q.image);
                          setDragId(null);
                          setOverId(null);
                        }
                      : undefined
                  }
                  onDragEnd={
                    editMode
                      ? () => {
                          setDragId(null);
                          setOverId(null);
                        }
                      : undefined
                  }
                  className={cn(
                    "group rounded-[calc(var(--radius)+5px)] overflow-hidden bg-card border transition-all duration-700",
                    editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                    isDropTarget
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                      : "border-border hover:-translate-y-[5px] hover:border-accent/42 hover:shadow-[0_26px_52px_-26px_rgba(200,150,80,0.5)]"
                  )}
                >
                  {editMode && (
                    <div className="flex items-center gap-1.5 px-5 pt-3 text-xs text-muted-foreground select-none">
                      <GripVertical className="w-3.5 h-3.5" />
                      Drag to reorder
                    </div>
                  )}
                  <div className="block relative overflow-hidden">
                    {q.hiRes ? (
                      <img
                        src={getSlotUrl(`card-${q.image}`)}
                        srcSet={`${getSlotUrl(`card-${q.image}`)} 800w${getSlotUrl(`card-${q.image}`, "2x") ? `, ${getSlotUrl(`card-${q.image}`, "2x")} 1600w` : ""}`}
                        sizes="(max-width: 900px) 50vw, 33vw"
                        width={800}
                        height={320}
                        loading="lazy"
                        decoding="async"
                        alt={`Research-grade vial, ${q.image} category`}
                        className="block w-full h-auto transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={getSlotUrl(`card-${q.image}`)}
                        width={400}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        alt={`Research-grade vial, ${q.image} category`}
                        className="block w-full h-auto transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(to top, oklch(1 0 0 / 55%) 1%, transparent 30%)" }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="block px-5 pt-[18px] pb-[22px]">
                    <span className="block text-[19px] font-semibold text-accent mb-2 [font-family:var(--font-display)]">
                      {q.metric}
                    </span>
                    <p className="text-[14.5px] text-muted-foreground leading-[1.55]">"{q.question}"</p>
                    <span className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition-all duration-300 group-hover:text-accent group-hover:gap-[11px]">
                      Ask Sunny <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <QuestionsEditControls editMode={editMode} saving={saving} onBegin={beginEdit} onCancel={cancelEdit} onSave={saveOrder} />
    </section>
  );
}

interface EditControlsProps {
  editMode: boolean;
  saving: boolean;
  onBegin: () => void;
  onCancel: () => void;
  onSave: () => void;
}

// Mounted only after client-side hydration confirms whether there's an
// admin session — the prerendered HTML for "/" never includes this button,
// its drag listeners, or the auth query, because this component doesn't
// exist in the tree at all until `mounted` flips true on the client.
function QuestionsEditControls(props: EditControlsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <QuestionsEditControlsInner {...props} />;
}

function QuestionsEditControlsInner({ editMode, saving, onBegin, onCancel, onSave }: EditControlsProps) {
  const { user } = useAdminAuth();
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
      {editMode ? (
        <>
          <Button variant="outline" onClick={onCancel} disabled={saving} className="shadow-lg rounded-full">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} className="shadow-lg rounded-full">
            {saving ? "Saving…" : "Save order"}
          </Button>
        </>
      ) : (
        <Button variant="secondary" onClick={onBegin} className="shadow-lg rounded-full">
          Edit layout
        </Button>
      )}
    </div>
  );
}
