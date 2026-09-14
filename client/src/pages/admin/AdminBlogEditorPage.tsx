import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, ImagePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, describeMimeTypes } from "@server/mediaValidation.ts";
import { SITE } from "@shared/site";
import {
  PENDING_IMAGE_SCHEME,
  POST_LANGS,
  POST_LANG_LABELS,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  pendingImageRef,
  slugify,
  type PostLang,
} from "@shared/blog";
import BlogCoverField, { type SavedCover } from "@/components/admin/BlogCoverField";
import PublishStatus, { publishStatusRefetchInterval } from "@/components/admin/PublishStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { POST_PROSE_CLASSNAME, renderMarkdown } from "@/lib/markdown";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type PostRow = RouterOutputs["blog"]["get"];

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverAlt: string;
  lang: PostLang;
  metaTitle: string;
  metaDescription: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  coverAlt: "",
  lang: "en",
  metaTitle: "",
  metaDescription: "",
};

function formFromRow(row: PostRow): FormState {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content,
    category: row.category ?? "",
    coverAlt: row.coverAlt ?? "",
    lang: (POST_LANGS as readonly string[]).includes(row.lang) ? (row.lang as PostLang) : "en",
    metaTitle: row.metaTitle ?? "",
    metaDescription: row.metaDescription ?? "",
  };
}

// A body image that's been inserted but not saved: the file itself, and a
// local object URL the preview shows it from until the save uploads it.
interface PendingImage {
  file: File;
  url: string;
}

function newImageToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// Shown under metaTitle/metaDescription. Not a limit — nothing refuses to
// save a longer value; past this point search results just truncate it, and
// the author is the one who decides whether that matters.
//
// It counts the EFFECTIVE value, not what's typed in the box: leaving the
// override empty doesn't mean the page has no title, it means the page falls
// back to "<post title> · Sunny", and that's the string Google truncates. A
// counter that read 0/60 on the exact posts most likely to be over the limit
// would be worse than no counter.
function CharacterCount({ value, fallback, max }: { value: string; fallback: string; max: number }) {
  const effective = value || fallback;
  const over = effective.length > max;
  return (
    <p className={`text-xs mt-1 ${over ? "text-amber-600" : "text-muted-foreground"}`}>
      {effective.length}/{max}
      {!value && effective ? " (from the fallback)" : ""}
      {over && " — longer than this usually gets cut off in search results"}
    </p>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground mt-0.5">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function AdminBlogEditorPage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const postId = params.id;
  const isNew = !postId;

  const existing = trpc.blog.get.useQuery({ id: postId ?? "" }, { enabled: !isNew });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadedForm, setLoadedForm] = useState<FormState>(EMPTY_FORM);
  // Once the author types their own slug we stop deriving it from the title.
  // For an existing post it starts "touched": a slug is a live URL, and
  // silently rewriting it because someone fixed a typo in the title would
  // break every link to the article.
  const [slugTouched, setSlugTouched] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Images wait here, in memory, until the post is saved — nothing is
  // uploaded when a file is picked, so abandoning the post leaves nothing
  // behind in R2.
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [pendingImages, setPendingImages] = useState<Map<string, PendingImage>>(() => new Map());
  // Mirror for the unmount cleanup, which can't read current state.
  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => () => pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url)), []);

  const clearPendingImages = () => {
    pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    setPendingImages(new Map());
  };

  // The form always reflects the row it was last loaded from (or saved as),
  // pending images included: the save that stored them also rewrote their
  // references into real URLs.
  const loadRow = (row: PostRow) => {
    const loaded = formFromRow(row);
    setForm(loaded);
    setLoadedForm(loaded);
    setSlugTouched(true);
    setSeoOpen(Boolean(row.metaTitle || row.metaDescription));
    setCoverFile(null);
    setCoverRemoved(false);
    clearPendingImages();
  };

  useEffect(() => {
    if (existing.data) loadRow(existing.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.data]);

  const status = existing.data?.status ?? "draft";
  const isPublished = status === "published";
  const savedCover: SavedCover | null = existing.data?.coverKey
    ? {
        url: existing.data.coverUrl,
        width: existing.data.coverWidth,
        height: existing.data.coverHeight,
        has2x: Boolean(existing.data.cover2xKey),
      }
    : null;

  const isDirty = useMemo(
    () =>
      coverFile !== null ||
      coverRemoved ||
      (isNew ? JSON.stringify(form) !== JSON.stringify(EMPTY_FORM) : JSON.stringify(form) !== JSON.stringify(loadedForm)),
    [form, loadedForm, isNew, coverFile, coverRemoved]
  );

  // Only images whose reference is still in the text count — one inserted
  // and then deleted before saving is simply never uploaded.
  const pendingInText = [...pendingImages.keys()].filter((token) => form.content.includes(pendingImageRef(token)));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setError(null);
    setNotice(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onTitleChange = (value: string) => {
    setError(null);
    setNotice(null);
    setForm((prev) => ({ ...prev, title: value, slug: slugTouched ? prev.slug : slugify(value) }));
  };

  const invalidate = () => {
    utils.blog.list.invalidate();
    utils.blog.publishStatus.invalidate();
    if (postId) utils.blog.get.invalidate({ id: postId });
  };

  // Publishing from here is where a failed republish matters most, so the
  // editor reports it too rather than only the post list.
  const publishStatus = trpc.blog.publishStatus.useQuery(undefined, {
    refetchInterval: publishStatusRefetchInterval,
  });

  const requestImageUpload = trpc.blog.requestImageUpload.useMutation();
  const create = trpc.blog.create.useMutation();
  const update = trpc.blog.update.useMutation();
  const publish = trpc.blog.publish.useMutation({ onError: (e) => setError(e.message) });
  const unpublish = trpc.blog.unpublish.useMutation({ onError: (e) => setError(e.message) });

  const busy = saving || publish.isPending || unpublish.isPending;

  // The same two steps /admin/media uses: a presigned URL, then the browser
  // PUTs the file straight to R2. What comes back is a temp key; the
  // create/update call below is what actually turns it into the post's image.
  const uploadToTemp = async (file: File, purpose: "cover" | "body"): Promise<string> => {
    const { uploadUrl, tempKey } = await requestImageUpload.mutateAsync({
      purpose,
      mimeType: file.type,
      bytes: file.size,
    });
    const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!res.ok) throw new Error(`Uploading ${file.name} failed. Please try again.`);
    return tempKey;
  };

  // Returns the post's id, or null if the save failed — every action below
  // saves first, so nothing can publish a version of the article that isn't
  // the one on screen. This is also the only place images are uploaded.
  const save = async (): Promise<string | null> => {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const [coverTempKey, images] = await Promise.all([
        coverFile ? uploadToTemp(coverFile, "cover") : Promise.resolve(null),
        Promise.all(
          pendingInText.map(async (token) => ({
            token,
            tempKey: await uploadToTemp(pendingImages.get(token)!.file, "body"),
          }))
        ),
      ]);
      const cover = coverTempKey
        ? { action: "replace" as const, tempKey: coverTempKey }
        : coverRemoved
          ? { action: "remove" as const }
          : { action: "keep" as const };

      const row = isNew
        ? await create.mutateAsync({ ...form, cover, images })
        : await update.mutateAsync({ ...form, cover, images, id: postId! });

      utils.blog.get.setData({ id: row.id }, row);
      loadRow(row);
      invalidate();
      return row.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed. Please try again.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const id = await save();
    if (!id) return;
    if (isNew) {
      // Land on the post's own URL so the next save updates it instead of
      // creating a second copy.
      navigate(`/admin/blog/${id}`, { replace: true });
      return;
    }
    setNotice(isPublished ? "Changes saved and published." : "Draft saved. Nothing public has changed.");
  };

  const handlePublish = async () => {
    const id = await save();
    if (!id) return;
    try {
      await publish.mutateAsync({ id });
      invalidate();
      if (isNew) navigate(`/admin/blog/${id}`, { replace: true });
      else setNotice("Published. The site is republishing now — it takes a few seconds.");
    } catch {
      /* onError set the message */
    }
  };

  const handleUnpublish = async () => {
    if (!postId) return;
    try {
      await unpublish.mutateAsync({ id: postId });
      invalidate();
      setNotice("Unpublished. The article is coming down from the site now.");
    } catch {
      /* onError set the message */
    }
  };

  // Inserts a markdown image reference for each file at the cursor (or over
  // the selection), as upload:<token> until the post is saved. The caret
  // ends up inside the first image's [] so its alt text is the next thing
  // the author types.
  const insertImages = (files: File[]) => {
    if (files.length === 0) return;
    const accepted = files.filter(
      (file) => (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type) && file.size <= MAX_UPLOAD_BYTES
    );
    const rejectedMessage =
      accepted.length < files.length
        ? `Only ${describeMimeTypes(ALLOWED_MIME_TYPES)} images up to 5 MB can be inserted.`
        : null;
    if (accepted.length === 0) {
      setError(rejectedMessage);
      return;
    }

    const tokens = accepted.map(() => newImageToken());
    setPendingImages((prev) => {
      const next = new Map(prev);
      accepted.forEach((file, i) => next.set(tokens[i], { file, url: URL.createObjectURL(file) }));
      return next;
    });

    const el = bodyRef.current;
    const start = el?.selectionStart ?? form.content.length;
    const end = el?.selectionEnd ?? start;
    const before = form.content.slice(0, start);
    const after = form.content.slice(end);
    // Each image as its own paragraph, without stacking up blank lines that
    // are already there.
    const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const trail = after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const snippet = tokens.map((token) => `![](${pendingImageRef(token)})`).join("\n\n");
    set("content", before + lead + snippet + trail + after);
    // After set(), which clears the error — otherwise the note about the
    // files that were skipped would vanish along with it.
    if (rejectedMessage) setError(rejectedMessage);

    const caret = before.length + lead.length + 2;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const resolvePreviewImage = (href: string) =>
    href.startsWith(PENDING_IMAGE_SCHEME) ? pendingImages.get(href.slice(PENDING_IMAGE_SCHEME.length))?.url : undefined;

  if (!isNew && existing.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading post…</p>;
  }
  if (!isNew && existing.isError) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">We couldn't load this post.</p>
        <Link href="/admin/blog">
          <Button variant="outline" size="sm">
            Back to posts
          </Button>
        </Link>
      </div>
    );
  }

  const previewCoverUrl = coverPreviewUrl ?? (!coverRemoved ? savedCover?.url ?? null : null);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Posts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {isNew ? "New post" : form.title || "Untitled"}
            </h1>
            {!isNew && (
              <Badge variant={isPublished ? "default" : "secondary"}>{isPublished ? "Published" : "Draft"}</Badge>
            )}
            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPublished && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              View
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button variant="outline" onClick={handleSave} disabled={busy}>
            {saving ? "Saving…" : isPublished ? "Save changes" : "Save draft"}
          </Button>
          {isPublished ? (
            <Button variant="outline" onClick={handleUnpublish} disabled={busy}>
              {unpublish.isPending ? "Unpublishing…" : "Unpublish"}
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={busy}>
              {publish.isPending ? "Publishing…" : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {notice && !error && (
        <p className="mb-4 rounded-lg border border-border/60 bg-secondary px-4 py-3 text-sm text-foreground">
          {notice}
        </p>
      )}
      {(publishStatus.data?.status === "error" ||
        publishStatus.data?.status === "pending" ||
        publishStatus.data?.status === "publishing") && (
        <div className="mb-4">
          <PublishStatus report={publishStatus.data} showPublished={false} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: the fields. */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Post title" />
            </Field>

            <Field label="Slug" hint={`The article's URL: /blog/${form.slug || "…"}`}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                onBlur={() => set("slug", slugify(form.slug))}
                placeholder="post-title"
              />
            </Field>

            <Field label="Excerpt" hint="The summary shown on the blog index and under the title.">
              <Textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={3}
                placeholder="One or two sentences about what this article covers."
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <Input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. Compounds"
                />
              </Field>

              <Field label="Language">
                <Select value={form.lang} onValueChange={(value) => set("lang", value as PostLang)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_LANGS.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {POST_LANG_LABELS[lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <BlogCoverField
              saved={savedCover}
              file={coverFile}
              previewUrl={coverPreviewUrl}
              removed={coverRemoved}
              alt={form.coverAlt}
              disabled={busy}
              onFileChange={(file) => {
                setNotice(null);
                setCoverFile(file);
              }}
              onRemovedChange={(removed) => {
                setNotice(null);
                setCoverRemoved(removed);
              }}
              onAltChange={(alt) => set("coverAlt", alt)}
            />
          </Card>

          <Card className="p-5">
            <button
              type="button"
              onClick={() => setSeoOpen((open) => !open)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground w-full"
            >
              {seoOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              SEO
              {!seoOpen && (form.metaTitle || form.metaDescription) && (
                <span className="text-xs font-normal text-muted-foreground">· customized</span>
              )}
            </button>

            {seoOpen && (
              <div className="mt-4 space-y-4">
                <Field label="Meta title" hint={`Leave empty to use "<post title> · ${SITE.name}".`}>
                  <Input
                    value={form.metaTitle}
                    onChange={(e) => set("metaTitle", e.target.value)}
                    placeholder={form.title || "Post title"}
                  />
                  <CharacterCount
                    value={form.metaTitle}
                    fallback={form.title ? `${form.title} · ${SITE.name}` : ""}
                    max={SEO_TITLE_MAX}
                  />
                </Field>

                <Field label="Meta description" hint="Leave empty to use the excerpt.">
                  <Textarea
                    value={form.metaDescription}
                    onChange={(e) => set("metaDescription", e.target.value)}
                    rows={3}
                    placeholder={form.excerpt || "A short description for search results."}
                  />
                  <CharacterCount value={form.metaDescription} fallback={form.excerpt} max={SEO_DESCRIPTION_MAX} />
                </Field>
              </div>
            )}
          </Card>

          {/* Not a <Field>: that wraps its children in a <label>, and a label
          containing a button activates the button when anything else in it
          is clicked. */}
          <Card className="p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <label htmlFor="post-body" className="text-sm font-medium text-foreground">
                  Body
                </label>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Markdown. HTML is not rendered — the preview shows exactly what the page will. Drop or paste
                  images into the text to insert them where the cursor is.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => bodyImageInputRef.current?.click()}
                disabled={busy}
              >
                <ImagePlus className="w-4 h-4" />
                Insert image
              </Button>
              <input
                ref={bodyImageInputRef}
                type="file"
                multiple
                accept={ALLOWED_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  insertImages([...(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </div>
            <Textarea
              id="post-body"
              ref={bodyRef}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("Files")) e.preventDefault();
              }}
              onDrop={(e) => {
                const files = [...e.dataTransfer.files];
                if (files.length === 0) return;
                e.preventDefault();
                insertImages(files);
              }}
              onPaste={(e) => {
                const files = [...e.clipboardData.files].filter((file) => file.type.startsWith("image/"));
                if (files.length === 0) return;
                e.preventDefault();
                insertImages(files);
              }}
              // Read-only while saving: the save rewrites upload:<token>
              // references into URLs, and the result replaces the text.
              readOnly={saving}
              rows={28}
              spellCheck={false}
              className="mt-1.5 font-mono text-sm leading-relaxed"
              placeholder={"## A heading\n\nA paragraph with **bold** text and a [link](https://example.com)."}
            />
            {pendingInText.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {pendingInText.length === 1 ? "1 image uploads" : `${pendingInText.length} images upload`} when you
                save.
              </p>
            )}
          </Card>
        </div>

        {/* Right column: the preview, rendered by the same code as the live
        page (client/src/lib/markdown.tsx) rather than an approximation. */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">Preview</p>
            {previewCoverUrl && (
              <img
                src={previewCoverUrl}
                alt={form.coverAlt}
                className="w-full aspect-[1200/630] object-cover rounded-xl border border-border/50 mb-6"
              />
            )}
            {form.category && (
              <Badge variant="secondary" className="text-xs mb-4">
                {form.category}
              </Badge>
            )}
            <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4">{form.title || "Untitled"}</h2>
            {form.excerpt && <p className="text-lg text-muted-foreground leading-relaxed mb-6">{form.excerpt}</p>}
            <div className={POST_PROSE_CLASSNAME}>
              {form.content.trim() ? (
                renderMarkdown(form.content, { resolveImageSrc: resolvePreviewImage })
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
