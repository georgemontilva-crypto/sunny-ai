import { Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { SOURCE_LABELS, STATUS_LABELS } from "./requestLabels";

type RequestRow = RouterOutputs["requests"]["list"]["rows"][number];

const NOTES_SAVE_DELAY_MS = 600;

export default function RequestDetailSheet({
  request,
  onOpenChange,
}: {
  request: RequestRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const setNotes = trpc.requests.setNotes.useMutation({
    onSuccess: () => utils.requests.list.invalidate(),
  });

  const [draftNotes, setDraftNotes] = useState("");
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftNotes(request?.notes ?? "");
    setSavedState("idle");
  }, [request?.id]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!request) return null;

  const handleNotesChange = (value: string) => {
    setDraftNotes(value);
    setSavedState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setNotes.mutate(
        { id: request.id, notes: value },
        {
          onSuccess: () => setSavedState("saved"),
          onError: () => setSavedState("idle"),
        }
      );
    }, NOTES_SAVE_DELAY_MS);
  };

  const mailtoHref = `mailto:${request.email}?subject=${encodeURIComponent("Re: your message to Sunny")}`;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{request.name}</SheetTitle>
          <SheetDescription>
            {request.email} · {SOURCE_LABELS[request.source] ?? request.source} · {STATUS_LABELS[request.status] ?? request.status}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-6">
          {request.goal && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Research goal
              </p>
              <p className="text-sm text-foreground">{request.goal}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Message</p>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{request.message}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal notes</p>
              {savedState === "saving" && <span className="text-xs text-muted-foreground">Saving…</span>}
              {savedState === "saved" && <span className="text-xs text-muted-foreground">Saved</span>}
            </div>
            <Textarea
              value={draftNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Notes visible to the team only…"
              className="rounded-lg border-border/60 focus:border-accent/50 min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-2">
          <Button asChild className="w-full font-semibold rounded-lg gap-2">
            <a href={mailtoHref}>
              <Mail className="w-4 h-4" />
              Reply by email
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
