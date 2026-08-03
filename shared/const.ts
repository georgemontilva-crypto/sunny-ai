export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// The /contact "What are you contacting us about?" select. `?plan=` on the
// URL (set by the /partner CTAs) maps 1:1 onto these values to preselect it.
export const CONTACT_TOPIC_VALUES = ["general", "standard", "whitelabel", "partnership"] as const;
export type ContactTopic = (typeof CONTACT_TOPIC_VALUES)[number];
export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "standard", label: "Sunny Standard" },
  { value: "whitelabel", label: "Sunny White-Label" },
  { value: "partnership", label: "Partnership" },
];
