import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc";

type PublishReport = RouterOutputs["blog"]["publishStatus"];
type PublishStep = PublishReport["failedSteps"][number];

// Polling interval for a publishStatus query: every 3 s while a republish is
// in flight, not at all otherwise.
export function publishStatusRefetchInterval(query: { state: { data?: PublishReport } }): number | false {
  const status = query.state.data?.status;
  return status === "pending" || status === "publishing" ? 3000 : false;
}

const STEP_LABELS: Record<PublishStep, string> = {
  lock: "waiting for another publish",
  "media-map": "images",
  "settings-map": "settings",
  "blog-map": "blog posts",
  prerender: "page rendering",
};

// The site-wide republish state — one pipeline behind media uploads and blog
// publishing alike. A failure says which step failed and whether the live
// site got the rest, instead of a generic "failed".
export default function PublishStatus({
  report,
  showPublished = true,
}: {
  report: PublishReport | undefined;
  // The post editor hides the steady "Published" state: next to one post's
  // controls it would read as "this post is published".
  showPublished?: boolean;
}) {
  const status = report?.status;

  if (status === "pending" || status === "publishing") {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Publishing changes…
      </span>
    );
  }

  if (status === "published" && showPublished) {
    return (
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="w-4 h-4" />
        Published
      </span>
    );
  }

  if (status === "error" && report) {
    const steps = report.failedSteps.map((step) => `${STEP_LABELS[step] ?? step} (${step})`).join(", ");
    return (
      <div className="flex items-start gap-2 text-sm text-red-600 max-w-xl">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">Publish failed: {steps || "unknown step"}</p>
          <p className="text-xs">
            {report.siteUpdated
              ? "Everything else was updated on the live site; what failed still shows its previous version."
              : "The live site was not updated."}
          </p>
          {report.error && (
            <p className="mt-1 text-xs font-mono whitespace-pre-wrap break-words text-red-600/80">{report.error}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
