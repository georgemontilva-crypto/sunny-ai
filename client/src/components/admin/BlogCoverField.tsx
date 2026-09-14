import { AlertTriangle, ImageUp, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, RASTER_MIME_TYPES, describeMimeTypes } from "@server/mediaValidation.ts";
import { COVER_SIZE, COVER_SIZE_2X } from "@shared/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SavedCover {
  url: string | null; // null only if R2_PUBLIC_URL isn't set on the server
  width: number | null;
  height: number | null;
  has2x: boolean;
}

// Presentational: the editor owns the state (and the picked file's object
// URL, which its preview column shows too). Nothing here uploads anything —
// a picked file waits in memory until the post is saved.
interface BlogCoverFieldProps {
  saved: SavedCover | null;
  file: File | null;
  previewUrl: string | null; // object URL of `file`
  removed: boolean; // the saved cover is marked to go on the next save
  alt: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemovedChange: (removed: boolean) => void;
  onAltChange: (alt: string) => void;
}

// Mirrors what server/blogImages.ts will do with the file, so the author
// finds out now rather than after saving: base resized to 1200×630 only from
// a source at least that wide, 2x only from one at least 2400 wide — never
// upscaled.
function sizeNote(width: number): { text: string; warn: boolean } {
  if (width < COVER_SIZE.width) {
    return {
      text: `This image is ${width}px wide, under the recommended ${COVER_SIZE.width}px — it will be saved at its own size, without a 2x version.`,
      warn: true,
    };
  }
  if (width < COVER_SIZE_2X.width) {
    return {
      text: `Upload ${COVER_SIZE_2X.width} × ${COVER_SIZE_2X.height} or larger to also get a 2x version for high-density screens.`,
      warn: false,
    };
  }
  return { text: `Saved at ${COVER_SIZE.width} × ${COVER_SIZE.height}, with a 2x version.`, warn: false };
}

export default function BlogCoverField({
  saved,
  file,
  previewUrl,
  removed,
  alt,
  disabled,
  onFileChange,
  onRemovedChange,
  onAltChange,
}: BlogCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [pickedWidth, setPickedWidth] = useState<number | null>(null);

  useEffect(() => {
    setPickedWidth(null);
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => setPickedWidth(img.naturalWidth);
    img.src = previewUrl;
  }, [previewUrl]);

  const pick = (candidate: File | undefined) => {
    if (!candidate || disabled) return;
    if (!(RASTER_MIME_TYPES as readonly string[]).includes(candidate.type)) {
      setError(`Use a ${describeMimeTypes(RASTER_MIME_TYPES)} image.`);
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError("That file is larger than 5 MB.");
      return;
    }
    setError("");
    onFileChange(candidate);
    onRemovedChange(false);
  };

  const hasSaved = Boolean(saved) && !removed;
  const hasImage = Boolean(file) || hasSaved;
  const shownUrl = previewUrl ?? (hasSaved ? saved!.url : null);
  const note = file && pickedWidth !== null ? sizeNote(pickedWidth) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Cover</span>
        {/* Always visible, image or not — something to prepare before
        choosing a file, not an error to react to afterwards. */}
        <span className="text-xs text-muted-foreground">
          Recommended: {COVER_SIZE.width} × {COVER_SIZE.height}
        </span>
      </div>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={hasImage ? "Replace the cover image" : "Choose a cover image"}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`relative mt-1.5 flex aspect-[1200/630] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          dragOver
            ? "border-accent bg-accent/5"
            : hasImage
              ? "border-border/60"
              : "border-border/60 bg-secondary/30 hover:border-accent/40"
        }`}
      >
        {shownUrl ? (
          <img src={shownUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : hasImage ? (
          <span className="text-xs text-muted-foreground">Cover saved (no preview: R2_PUBLIC_URL isn't set)</span>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-foreground">Drag & drop an image, or click to choose</span>
            <span className="text-xs text-muted-foreground">
              {COVER_SIZE.width} × {COVER_SIZE.height} · JPEG, PNG or WebP · up to 5 MB
            </span>
          </div>
        )}
        {dragOver && hasImage && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-medium text-foreground">
            Drop to replace
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={RASTER_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          // Lets the same file be picked again after a Remove.
          e.target.value = "";
        }}
      />

      {hasImage && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <ImageUp className="h-4 w-4" />
            Replace
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-600"
            onClick={() => {
              setError("");
              onFileChange(null);
              onRemovedChange(Boolean(saved));
            }}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
          {!file && saved?.width && saved.height ? (
            <span className="text-xs text-muted-foreground">
              {saved.width} × {saved.height}
              {saved.has2x ? " · with 2x" : ""}
            </span>
          ) : null}
        </div>
      )}

      {file && (
        <p className="mt-2 text-xs text-muted-foreground">
          {saved && !removed ? "Replaces the current cover" : "Uploads"} when you save.
          {saved && (
            <>
              {" "}
              <button type="button" className="underline" onClick={() => onFileChange(null)} disabled={disabled}>
                Keep the current one
              </button>
            </>
          )}
        </p>
      )}
      {note && <p className={`mt-1 text-xs ${note.warn ? "text-amber-600" : "text-muted-foreground"}`}>{note.text}</p>}

      {!file && removed && saved && (
        <p className="mt-2 text-xs text-muted-foreground">
          The cover will be removed when you save.{" "}
          <button type="button" className="underline" onClick={() => onRemovedChange(false)} disabled={disabled}>
            Undo
          </button>
        </p>
      )}

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <label className="mt-4 block">
        <span className="text-sm font-medium text-foreground">Alt text</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          What the image shows, for screen readers. Leave it empty if the image is only decorative — share
          previews then use the post title.
        </span>
        <Input
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          disabled={!hasImage || disabled}
          placeholder={hasImage ? "e.g. Vials of research peptides on a lab bench" : "Add a cover first"}
          className="mt-1.5"
        />
      </label>
    </div>
  );
}
