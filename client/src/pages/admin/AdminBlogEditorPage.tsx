import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import { BLOG_COVER_SLOTS } from "@server/mediaCatalog.ts";
import { SITE } from "@shared/site";
import {
  POST_LANGS,
  POST_LANG_LABELS,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  slugify,
  type PostLang,
} from "@shared/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSlotUrl } from "@/lib/media";
import { POST_PROSE_CLASSNAME, renderMarkdown } from "@/lib/markdown";
import { trpc } from "@/lib/trpc";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverSlot: string;
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
  coverSlot: "",
  lang: "en",
  metaTitle: "",
  metaDescription: "",
};

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

  useEffect(() => {
    if (!existing.data) return;
    const row = existing.data;
    const loaded: FormState = {
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? "",
      content: row.content,
      category: row.category ?? "",
      coverSlot: row.coverSlot ?? "",
      lang: (POST_LANGS as readonly string[]).includes(row.lang) ? (row.lang as PostLang) : "en",
      metaTitle: row.metaTitle ?? "",
      metaDescription: row.metaDescription ?? "",
    };
    setForm(loaded);
    setLoadedForm(loaded);
    setSlugTouched(true);
    setSeoOpen(Boolean(row.metaTitle || row.metaDescription));
  }, [existing.data]);

  const status = existing.data?.status ?? "draft";
  const isPublished = status === "published";
  const isDirty = useMemo(
    () => (isNew ? JSON.stringify(form) !== JSON.stringify(EMPTY_FORM) : JSON.stringify(form) !== JSON.stringify(loadedForm)),
    [form, loadedForm, isNew]
  );

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

  const create = trpc.blog.create.useMutation({ onError: (e) => setError(e.message) });
  const update = trpc.blog.update.useMutation({ onError: (e) => setError(e.message) });
  const publish = trpc.blog.publish.useMutation({ onError: (e) => setError(e.message) });
  const unpublish = trpc.blog.unpublish.useMutation({ onError: (e) => setError(e.message) });

  const busy = create.isPending || update.isPending || publish.isPending || unpublish.isPending;

  // Returns the post's id, or null if the save failed — every action below
  // saves first, so nothing can publish a version of the article that isn't
  // the one on screen.
  const save = async (): Promise<string | null> => {
    setError(null);
    setNotice(null);
    try {
      if (isNew) {
        const row = await create.mutateAsync(form);
        invalidate();
        return row?.id ?? null;
      }
      await update.mutateAsync({ ...form, id: postId! });
      setLoadedForm(form);
      invalidate();
      return postId!;
    } catch {
      return null; // the mutation's onError already set the message
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

  const coverUrl = form.coverSlot ? getSlotUrl(form.coverSlot) : undefined;

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
            {update.isPending || create.isPending
              ? "Saving…"
              : isPublished
                ? "Save changes"
                : "Save draft"}
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

            <Field
              label="Cover"
              hint="Pick one of the blog cover slots. Upload the image itself in Media."
            >
              <Select value={form.coverSlot || "none"} onValueChange={(v) => set("coverSlot", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No cover</SelectItem>
                  {BLOG_COVER_SLOTS.map((def) => (
                    <SelectItem key={def.slot} value={def.slot}>
                      {def.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.coverSlot &&
              (coverUrl ? (
                <img src={coverUrl} alt="" className="w-full rounded-lg border border-border/60 object-cover" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nothing uploaded to this slot yet — the post will show no cover.{" "}
                  <Link href="/admin/media" className="underline">
                    Upload it in Media
                  </Link>
                  .
                </p>
              ))}
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

          <Card className="p-5">
            <Field
              label="Body"
              hint="Markdown. HTML is not rendered — the preview shows exactly what the page will."
            >
              <Textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                rows={28}
                spellCheck={false}
                className="font-mono text-sm leading-relaxed"
                placeholder={"## A heading\n\nA paragraph with **bold** text and a [link](https://example.com)."}
              />
            </Field>
          </Card>
        </div>

        {/* Right column: the preview, rendered by the same code as the live
        page (client/src/lib/markdown.tsx) rather than an approximation. */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-6 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">Preview</p>
            {form.category && (
              <Badge variant="secondary" className="text-xs mb-4">
                {form.category}
              </Badge>
            )}
            <h2 className="text-3xl font-bold tracking-tight leading-tight mb-4">{form.title || "Untitled"}</h2>
            {form.excerpt && <p className="text-lg text-muted-foreground leading-relaxed mb-6">{form.excerpt}</p>}
            <div className={POST_PROSE_CLASSNAME}>
              {form.content.trim() ? (
                renderMarkdown(form.content)
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
