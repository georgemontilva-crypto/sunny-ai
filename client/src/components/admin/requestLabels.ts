import { CONTACT_TOPIC_VALUES, CONTACT_TOPICS } from "@shared/const.ts";

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
  spam: "Spam",
};

export const STATUS_ORDER = ["new", "contacted", "closed", "spam"] as const;

export const SOURCE_ORDER = ["contact", "partner", "newsletter"] as const;

export const SOURCE_LABELS: Record<string, string> = {
  contact: "Contact",
  partner: "Partner",
  newsletter: "Newsletter",
};

export const TOPIC_ORDER = CONTACT_TOPIC_VALUES;

export const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  CONTACT_TOPICS.map((t) => [t.value, t.label])
);
