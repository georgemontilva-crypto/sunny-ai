import { useEffect, useState } from "react";
import { SITE } from "@shared/site.ts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type SettingKey =
  | "contact_email"
  | "newsletter_email"
  | "plan_standard_price"
  | "plan_standard_period"
  | "plan_standard_setup"
  | "plan_standard_note"
  | "plan_whitelabel_price"
  | "plan_whitelabel_note"
  | "partner_contact_phone"
  | "partner_contact_email";

function SettingRow({
  label,
  description,
  settingKey,
  fallback,
  placeholder,
  emptyHint,
}: {
  label: string;
  description: string;
  settingKey: SettingKey;
  // Required field: shown as the input's placeholder, and used both as the
  // "falls back to X" hint and as the value the server still refuses to
  // clear to empty. Partner field: omit — pass `placeholder`/`emptyHint`
  // instead, since "" is a legitimate, savable state for these (the live
  // page shows its own dashed placeholder or hides the line).
  fallback?: string;
  placeholder?: string;
  emptyHint?: string;
}) {
  const utils = trpc.useUtils();
  const { data } = trpc.settings.getAll.useQuery();
  const update = trpc.settings.update.useMutation({ onSuccess: () => utils.settings.getAll.invalidate() });
  const allowEmpty = fallback === undefined;

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
        onBlur={() => {
          const trimmed = value.trim();
          if (trimmed === stored) return;
          if (!trimmed && !allowEmpty) return;
          update.mutate({ key: settingKey, value: trimmed });
        }}
        placeholder={fallback ?? placeholder}
        className="rounded-lg border-border/60 focus:border-accent/50"
      />
      {!stored && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {fallback ? `Falls back to ${fallback} until set.` : emptyHint}
        </p>
      )}
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

      <h2 className="text-lg font-semibold text-foreground pt-4">Partner page</h2>
      <p className="text-xs text-muted-foreground -mt-3">
        Baked into /partner on save, same as an image upload — publishing takes a few seconds.
      </p>

      <SettingRow
        label="Sunny Standard — price"
        description='Big figure on the pricing card, e.g. "$799".'
        settingKey="plan_standard_price"
        placeholder="$799"
        emptyHint='Falls back to "$799" until set.'
      />
      <SettingRow
        label="Sunny Standard — billing period"
        description='Shown right after the price, e.g. "/month".'
        settingKey="plan_standard_period"
        placeholder="/month"
        emptyHint='Falls back to "/month" until set.'
      />
      <SettingRow
        label="Sunny Standard — setup fee"
        description='Small line under the price, e.g. "+ $1,500 one-time setup fee".'
        settingKey="plan_standard_setup"
        placeholder="+ $1,500 one-time setup fee"
        emptyHint='Falls back to "+ $1,500 one-time setup fee" until set.'
      />
      <SettingRow
        label="Sunny Standard — note"
        description='Small line under the setup fee, e.g. "Cancel monthly · No long-term contract".'
        settingKey="plan_standard_note"
        placeholder="Cancel monthly · No long-term contract"
        emptyHint='Falls back to "Cancel monthly · No long-term contract" until set.'
      />
      <SettingRow
        label="Sunny White-Label — price"
        description='Big figure on the pricing card, e.g. "Custom".'
        settingKey="plan_whitelabel_price"
        placeholder="Custom"
        emptyHint='Falls back to "Custom" until set.'
      />
      <SettingRow
        label="Sunny White-Label — note"
        description='Small line under the price, e.g. "Starting at $2,500 setup + $999/mo".'
        settingKey="plan_whitelabel_note"
        placeholder="Starting at $2,500 setup + $999/mo · Minimum 6 months · Pricing scales with traffic & customization"
        emptyHint="Falls back to the default note until set."
      />
      <SettingRow
        label="Contact phone"
        description="Shown under the plans as a tel: link."
        settingKey="partner_contact_phone"
        placeholder="+1 555 123 4567"
        emptyHint="The contact line is hidden from /partner until this or the email below is set."
      />
      <SettingRow
        label="Contact email"
        description="Shown under the plans as a mailto: link. Separate from the site's contact-form inbox above."
        settingKey="partner_contact_email"
        placeholder="partners@yourdomain.com"
        emptyHint="The contact line is hidden from /partner until this or the phone above is set."
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
