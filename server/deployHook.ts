// Batches Railway deploy-hook calls: several uploads in a row reset the
// timer instead of each firing its own build.
const DEBOUNCE_MS = 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending = false;

export function scheduleDeploy(): void {
  pending = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    pending = false;
    const hook = process.env.RAILWAY_DEPLOY_HOOK;
    if (!hook) return;
    fetch(hook, { method: "POST" }).catch((err) => {
      console.error("[deploy-hook] failed:", err);
    });
  }, DEBOUNCE_MS);
}

export function isDeployPending(): boolean {
  return pending;
}
