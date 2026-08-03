import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GripVertical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <section className="py-24 px-4 bg-secondary/30" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Real questions people ask
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Science-first explanations based on what you are exploring.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((q, i) => {
            const isDropTarget = editMode && overId === q.image && dragId !== q.image;
            return (
              <motion.div
                key={q.image}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              >
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
                    "h-full rounded-2xl",
                    editMode && "cursor-grab active:cursor-grabbing",
                    isDropTarget && "ring-2 ring-accent ring-offset-2 ring-offset-background"
                  )}
                >
                  <Card className="p-6 h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                    {editMode && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 -mt-1 select-none">
                        <GripVertical className="w-3.5 h-3.5" />
                        Drag to reorder
                      </div>
                    )}
                    {q.hiRes ? (
                      <img
                        src={getSlotUrl(`card-${q.image}`)}
                        srcSet={`${getSlotUrl(`card-${q.image}`)} 800w${getSlotUrl(`card-${q.image}`, "2x") ? `, ${getSlotUrl(`card-${q.image}`, "2x")} 1600w` : ""}`}
                        sizes="(max-width: 768px) 100vw, 400px"
                        width={800}
                        height={320}
                        loading="lazy"
                        decoding="async"
                        alt={`Research-grade vial, ${q.image} category`}
                        className="w-full h-40 object-cover object-center rounded-xl mb-4"
                      />
                    ) : (
                      <img
                        src={getSlotUrl(`card-${q.image}`)}
                        width={400}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        alt={`Research-grade vial, ${q.image} category`}
                        className="w-full h-40 object-cover object-center rounded-xl mb-4"
                      />
                    )}
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-accent">{q.metric}</span>
                      <span className="text-xs text-muted-foreground">{q.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">"{q.question}"</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-accent group-hover:gap-3 transition-all">
                      Ask Sunny <ArrowRight className="w-3 h-3" />
                    </div>
                  </Card>
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
