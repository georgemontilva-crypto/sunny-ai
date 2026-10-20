// Publishes scheduled posts when their time comes.
//
// A draft with `scheduled_at` set is an instruction: at that instant, make
// it public. This module is what carries it out — a timer in this process,
// not an external cron, so it reuses the same republish the panel uses and
// there is nothing extra to deploy or keep in sync.
//
// Why a timer and not a cron service: publishing has to call
// scheduleRepublish() in the process that serves the site, because that is
// where the regenerated HTML is written. A separate cron would have to go
// through HTTP to ask this process to republish, which is the same thing
// with an extra moving part and an extra secret.
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { writeAudit } from "./auditLog.ts";
import { withPostLock } from "./blogImages.ts";
import { getDb } from "./db.ts";
import { scheduleRepublish } from "./republish.ts";
import { posts } from "./schema.ts";

const TICK_MS = 60_000;

// One run at a time. The queries are small, but a tick that overlaps itself
// could read a post twice before the first write lands; the per-post lock
// below would serialise them anyway, and this keeps the logs honest.
let running = false;

// Posts the scheduler refuses to publish (empty body) and has already
// complained about. Without this, a single bad row logs once a minute for
// as long as the process lives. Process-local on purpose: a restart is a
// reasonable moment to say it again.
const warned = new Set<string>();

export async function runScheduledPublishes(now: Date = new Date()): Promise<number> {
  if (running) return 0;
  running = true;
  try {
    // No DATABASE_URL — local static builds and the prerender run this way.
    // Nothing to publish and nothing to complain about.
    const db = getDb();
    if (!db) return 0;

    const due = await db
      .select({ id: posts.id, slug: posts.slug })
      .from(posts)
      .where(and(eq(posts.status, "draft"), isNotNull(posts.scheduledAt), lte(posts.scheduledAt, now)));

    if (due.length === 0) return 0;

    let publishedCount = 0;
    for (const candidate of due) {
      // The same lock the editor's save and delete take. Without it a save
      // in flight could write the row back as a draft a moment after this
      // publishes it.
      await withPostLock(candidate.id, async () => {
        // Re-read inside the lock: between the query above and this moment
        // the post may have been published by hand, unscheduled, or
        // deleted.
        const [post] = await db.select().from(posts).where(eq(posts.id, candidate.id));
        if (!post) return;
        if (post.status !== "draft" || !post.scheduledAt || post.scheduledAt > now) return;

        // Same bar as the Publish button: never put an empty article live.
        // The schedule is left in place so fixing the body is enough to
        // make the next tick pick it up.
        if (!post.content.trim()) {
          if (!warned.has(post.id)) {
            warned.add(post.id);
            console.error(
              `[scheduler] "${post.slug}" was due at ${post.scheduledAt.toISOString()} but has no content — not publishing. Add a body and it will go out on the next check.`
            );
          }
          return;
        }
        warned.delete(post.id);

        await db
          .update(posts)
          .set({
            status: "published",
            // The scheduled instant, not the moment the timer happened to
            // fire. A tick is up to a minute late, and the article should
            // carry the date it was meant to carry.
            publishedAt: post.publishedAt ?? post.scheduledAt,
            scheduledAt: null,
          })
          .where(eq(posts.id, post.id));

        await writeAudit(db, {
          // Attributed to whoever wrote the post, since nobody is logged in
          // when this runs. The action name is what distinguishes it from a
          // click on Publish.
          userId: post.authorId,
          action: "blog.publish.scheduled",
          entity: post.id,
          detail: { slug: post.slug, scheduledFor: post.scheduledAt.toISOString() },
        });

        publishedCount++;
        console.log(`[scheduler] published "${post.slug}" (scheduled for ${post.scheduledAt.toISOString()})`);
      });
    }

    // One republish for the whole batch, after every row is written. Two
    // posts due in the same minute regenerate the site once, and no
    // republish can run against a half-applied batch.
    if (publishedCount > 0) scheduleRepublish();
    return publishedCount;
  } catch (err) {
    // Never let a bad tick kill the process — the next one is a minute away
    // and the failure is almost always a transient database blip.
    console.error("[scheduler] tick failed:", err);
    return 0;
  } finally {
    running = false;
  }
}

export function startPublishScheduler(): void {
  // A first pass shortly after boot catches anything that came due while
  // the process was down — a deploy, a restart, a sleeping container. The
  // delay keeps it off the critical path of the first requests.
  setTimeout(() => void runScheduledPublishes(), 10_000);

  const timer = setInterval(() => void runScheduledPublishes(), TICK_MS);
  // Don't hold the event loop open on shutdown.
  timer.unref?.();
  console.log(`[scheduler] scheduled publishing active (checking every ${TICK_MS / 1000}s)`);
}
