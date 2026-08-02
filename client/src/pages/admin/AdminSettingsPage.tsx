import { useEffect, useState } from "react";
import { SITE } from "@shared/site.ts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

function SettingRow({
  label,
  description,
  settingKey,
  fallback,
}: {
  label: string;
  description: string;
  settingKey: "contact_email" | "newsletter_email";
  fallback: string;
}) {
  const utils = trpc.useUtils();
  const { data } = trpc.settings.getAll.useQuery();
  const update = trpc.settings.update.useMutation({ onSuccess: () => utils.settings.getAll.invalidate() });

  const stored = data?.find((row) => row.key === settingKey)?.value ?? "";
  const [value, setValue] = useState(stored);

  useEffect(() => setValue(stored), [stored]);

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value.trim() && value !== stored && update.mutate({ key: settingKey, value: value.trim() })}
        placeholder={fallback}
        className="rounded-lg border-border/60 focus:border-accent/50"
      />
      {!stored && <p className="text-xs text-muted-foreground mt-1.5">Falls back to {fallback} until set.</p>}
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <SettingRow
        label="Contact email"
        description="Where messages from the site's contact form get sent."
        settingKey="contact_email"
        fallback={SITE.contactEmail}
      />

      <SettingRow
        label="Newsletter email"
        description="Where newsletter signups get sent."
        settingKey="newsletter_email"
        fallback={SITE.contactEmail}
      />

      <Card>
        <CardHeader>
          <CardTitle>Indexable</CardTitle>
          <CardDescription>
            {SITE.indexable ? "The site is indexable." : "The site is not indexable."} This is set in
            shared/site.ts and only changes with a commit — not editable here, so a database outage can never
            silently make the site indexable.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
