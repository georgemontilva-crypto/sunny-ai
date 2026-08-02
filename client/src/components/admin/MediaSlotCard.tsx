import { AlertTriangle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { MediaSlotDef } from "@server/mediaCatalog.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSlotUrl } from "@/lib/media";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type MediaRow = RouterOutputs["media"]["list"][number];

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function MediaSlotCard({ def, row }: { def: MediaSlotDef; row: MediaRow | undefined }) {
  const utils = trpc.useUtils();
  const requestUploadUrl = trpc.media.requestUploadUrl.useMutation();
  const confirmUpload = trpc.media.confirmUpload.useMutation();
  const updateAlt = trpc.media.updateAlt.useMutation({ onSuccess: () => utils.media.list.invalidate() });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [alt, setAlt] = useState(row?.alt ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [skippedNotice, setSkippedNotice] = useState<string[]>([]);

  const variants = (row?.variants ?? {}) as Record<string, { key: string; width: number; height: number; bytes: number }>;
  const base = variants.base;
  const currentUrl = getSlotUrl(def.slot);
  const declaredVariants = Object.keys(def.variants);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    setError("");
    setSkippedNotice([]);
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    if (!previewFile) return;
    setUploading(true);
    setError("");
    try {
      const { uploadUrl, tempKey } = await requestUploadUrl.mutateAsync({
        slot: def.slot,
        mimeType: previewFile.type,
        bytes: previewFile.size,
      });
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: previewFile,
        headers: { "Content-Type": previewFile.type },
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      const result = await confirmUpload.mutateAsync({ slot: def.slot, tempKey });
      setSkippedNotice(result.skipped);
      setPreviewFile(null);
      setPreviewUrl(null);
      await utils.media.list.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAltBlur = () => {
    if (alt !== (row?.alt ?? "") && row) {
      updateAlt.mutate({ slot: def.slot, alt });
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{def.label}</p>
        <p className="text-xs text-muted-foreground">{def.slot}</p>
      </div>

      <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary/40 flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : currentUrl ? (
          <img src={currentUrl} alt={row?.alt ?? def.label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No image yet</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {declaredVariants.map((name) => (
          <Badge key={name} variant={variants[name] ? "secondary" : "outline"} className="text-[10px]">
            {name}
            {!variants[name] && " (missing)"}
          </Badge>
        ))}
      </div>

      {base && (
        <p className="text-xs text-muted-foreground">
          {base.width}×{base.height} · {formatBytes(base.bytes)}
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-4 text-xs cursor-pointer transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border/60 text-muted-foreground hover:border-accent/40"
        }`}
      >
        <Upload className="w-4 h-4" />
        {previewFile ? previewFile.name : "Drag & drop or click to choose a file"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png,image/svg+xml"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {previewFile && (
        <Button size="sm" className="w-full" onClick={handleConfirm} disabled={uploading}>
          {uploading ? "Uploading…" : "Confirm upload"}
        </Button>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {skippedNotice.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          The uploaded file is smaller than the declared {skippedNotice.join(", ")} variant, so it was skipped —
          only the base image was saved.
        </p>
      )}

      <Input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={handleAltBlur}
        placeholder="Alt text…"
        className="h-8 text-xs rounded-lg border-border/60 focus:border-accent/50"
        disabled={!row}
      />
    </Card>
  );
}
