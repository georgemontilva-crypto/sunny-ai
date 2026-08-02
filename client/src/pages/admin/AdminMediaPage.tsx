import { Loader2 } from "lucide-react";
import { MEDIA_SLOTS } from "@server/mediaCatalog.ts";
import MediaSlotCard from "@/components/admin/MediaSlotCard";
import { trpc } from "@/lib/trpc";

export default function AdminMediaPage() {
  const { data, isLoading, isError } = trpc.media.list.useQuery();
  const deployStatus = trpc.media.deployStatus.useQuery(undefined, {
    refetchInterval: (query) => (query.state.data?.pending ? 3000 : false),
  });

  const rowBySlot = new Map((data ?? []).map((row) => [row.slot, row]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Media</h1>
        {deployStatus.data?.pending && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Publishing changes…
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
