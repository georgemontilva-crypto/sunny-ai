import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ArrowLeft, BookOpen } from "lucide-react";
import { getPostBySlug } from "@/lib/blog";
import { POST_PROSE_CLASSNAME, renderMarkdown } from "@/lib/markdown";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const post = getPostBySlug(params.slug ?? "");

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 pt-32 pb-24 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Artículo no encontrado</h1>
          <p className="text-muted-foreground mb-8">El artículo que buscas no existe o fue eliminado.</p>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { cover } = post;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <article className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>

        <header className="mb-10">
          {/* No cover, no header image and no space held for one. The box is
          always the 1200×630 shape, so a cover saved smaller than that (or a
          different ratio) is cropped to match rather than changing the
          layout. */}
          {cover && (
            <img
              src={cover.url}
              srcSet={cover.url2x ? `${cover.url} ${cover.width}w, ${cover.url2x} ${cover.width * 2}w` : undefined}
              sizes={cover.url2x ? "(min-width: 48rem) 736px, calc(100vw - 2rem)" : undefined}
              alt={cover.alt}
              width={cover.width}
              height={cover.height}
              fetchPriority="high"
              className="w-full aspect-[1200/630] object-cover rounded-2xl border border-border/50 mb-8"
            />
          )}

          {post.category && (
            <div className="flex items-center gap-3 mb-5">
              <Badge variant="secondary" className="text-xs">{post.category}</Badge>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">{post.title}</h1>

          <p className="text-xl text-muted-foreground leading-relaxed mb-8">{post.excerpt}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground pb-8 border-b border-border/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTimeMinutes} min de lectura
            </span>
          </div>
        </header>

        <div className={POST_PROSE_CLASSNAME}>{renderMarkdown(post.content)}</div>

        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h3 className="text-xl font-bold mb-3">¿Tienes preguntas sobre un compuesto?</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Escríbenos y te ayudamos a encontrar la literatura relevante para tu investigación.
          </p>
          <Link href="/contact">
            <Button className="font-semibold">Hablar con Sunny</Button>
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
