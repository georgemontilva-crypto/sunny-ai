import { motion } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowRight, BookOpen, Rss } from "lucide-react";
import { getAllPosts, type BlogPostMeta } from "@/lib/blog";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCard({ post, index }: { post: BlogPostMeta; index: number }) {
  const isFirst = index === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`group ${isFirst ? "md:col-span-2" : ""}`}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <div className="h-full rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          <div className={`relative overflow-hidden ${isFirst ? "h-56" : "h-44"} bg-muted/40 flex items-center justify-center`}>
            <BookOpen className="w-16 h-16 text-primary/20" />
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-medium">
                {post.category}
              </Badge>
            </div>
          </div>

          <div className="p-6">
            <h2 className={`font-bold mb-3 group-hover:text-primary transition-colors leading-tight ${isFirst ? "text-2xl" : "text-lg"}`}>
              {post.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
              {post.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readingTimeMinutes} min de lectura
                </span>
              </div>
              <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Leer más <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Badge variant="outline" className="mb-6 text-primary border-primary/30 bg-primary/5 px-4 py-1.5">
            <Rss className="w-3.5 h-3.5 mr-2" />
            Blog de Sunny
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
            Investigación sobre péptidos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Artículos educativos sobre compuestos, evidencia disponible y cómo leer el panorama de investigación.
          </p>
        </motion.div>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Próximamente</h3>
              <p className="text-muted-foreground">Estamos preparando nuevos artículos.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post, i) => (
                <BlogCard key={post.slug} post={post} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
