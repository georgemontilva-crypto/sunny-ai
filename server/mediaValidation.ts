export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/webp", "image/jpeg", "image/png", "image/svg+xml"] as const;
// Blog covers: the cover is also the post's og:image, and share cards don't
// render SVG.
export const RASTER_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

const TYPE_LABELS: Record<string, string> = {
  "image/webp": "WebP",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/svg+xml": "SVG",
};

// "WebP, JPEG, PNG, or SVG" — for the error messages, so they always name
// exactly the types that particular upload accepts.
export function describeMimeTypes(types: readonly string[]): string {
  const labels = types.map((type) => TYPE_LABELS[type] ?? type);
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")}, or ${labels[labels.length - 1]}` : (labels[0] ?? "");
}

// Never trust the client's declared mimeType — sniff the real bytes.
export function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  const head = buffer.subarray(0, 256).toString("utf-8").trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    return "image/svg+xml";
  }
  return null;
}
