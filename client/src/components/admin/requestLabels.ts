export const STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
  spam: "Spam",
};

export const STATUS_ORDER = ["new", "contacted", "closed", "spam"] as const;

export const SOURCE_ORDER = ["contact", "partner", "newsletter"] as const;

export const SOURCE_LABELS: Record<string, string> = {
  contact: "Contacto",
  partner: "Partner",
  newsletter: "Boletín",
};
