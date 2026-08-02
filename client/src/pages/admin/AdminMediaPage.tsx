import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { MEDIA_SLOTS } from "@server/mediaCatalog.ts";
import MediaSlotCard from "@/components/admin/MediaSlotCard";
import { trpc } from "@/lib/trpc";

export default function AdminMediaPage() {
  const { data, isLoading, isError } = trpc.media.list.useQuery();
  const publishStatus = trpc.media.publishStatus.useQuery(undefined, {
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "pending" || s === "publishing" ? 3000 : false;
    },
  });

  const rowBySlot = new Map((data ?? []).map((row) => [row.slot, row]));
  const status = publishStatus.data?.status;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Media</h1>
        {(status === "pending" || status === "publishing") && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing changes…
          </span>
        )}
        {status === "published" && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            Published
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" />
            Publish failed: {publishStatus.data?.error ?? "unknown error"}
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading media…</p>
      ) : isError ? (
        <p className="text-sm text-foreground">We couldn't load the media library. Check your connection and try again.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEDIA_SLOTS.map((def) => (
            <MediaSlotCard key={def.slot} def={def} row={rowBySlot.get(def.slot)} />
          ))}
        </div>
      )}
    </div>
  );
}
