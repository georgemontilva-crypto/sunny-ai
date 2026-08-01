import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { STATUS_LABELS, STATUS_ORDER } from "./requestLabels";

// Trigger itself is colored like the status it represents — nueva = sol
// (primary), contactada = arena media (secondary), cerrada/spam = tenue.
const TRIGGER_CLASS: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  contacted: "bg-secondary text-secondary-foreground border-transparent",
  closed: "bg-muted text-muted-foreground border-transparent",
  spam: "bg-muted text-muted-foreground border-transparent",
};

export default function RequestStatusSelect({ id, status }: { id: string; status: string }) {
  const utils = trpc.useUtils();
  const setStatus = trpc.requests.setStatus.useMutation({
    onSuccess: () => utils.requests.list.invalidate(),
  });

  return (
    <Select
      value={status}
      onValueChange={(value) => setStatus.mutate({ id, status: value as (typeof STATUS_ORDER)[number] })}
    >
      <SelectTrigger
        className={`h-7 w-[130px] rounded-full text-xs font-medium ${TRIGGER_CLASS[status] ?? ""}`}
      >
        <SelectValue>{STATUS_LABELS[status] ?? status}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
