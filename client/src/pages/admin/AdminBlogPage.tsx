import { AlertTriangle, CheckCircle2, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { POST_LANG_LABELS, type PostLang } from "@shared/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type PostRow = RouterOutputs["blog"]["list"][number];

function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export default function AdminBlogPage() {
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PostRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = trpc.blog.list.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as "draft" | "published"),
    search: debouncedSearch || undefined,
  });

  // Same global publish pipeline the media page reports on — an article
  // going live and an image being replaced are the same republish.
  const publishStatus = trpc.blog.publishStatus.useQuery(undefined, {
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "pending" || s === "publishing" ? 3000 : false;
    },
  });

  const remove = trpc.blog.delete.useMutation({
    onSuccess: () => {
      setPendingDelete(null);
      utils.blog.list.invalidate();
      utils.blog.publishStatus.invalidate();
    },
    onError: (error) => setDeleteError(error.message),
  });

  const hasActiveFilters = statusFilter !== "all" || debouncedSearch !== "";
  const status = publishStatus.data?.status;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Blog</h1>
        <div className="flex items-center gap-4">
          {(status === "pending" || status === "publishing") && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Publishing changes…
            </span>
          )}
          {status === "published" && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
              Published
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Publish failed: {publishStatus.data?.error ?? "unknown error"}
            </span>
          )}
          <Link href="/admin/blog/new">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New post
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title…"
            className="pl-9 rounded-lg border-border/60 focus:border-accent/50"
          />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading posts…</div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-foreground">We couldn't load the posts.</p>
            <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <p className="text-sm text-foreground">
              {hasActiveFilters ? "No posts match these filters." : "No posts yet."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Try a different status or search term."
                : "Write the first one — it stays a draft until you publish it."}
            </p>
            {!hasActiveFilters && (
              <Link href="/admin/blog/new">
                <Button variant="outline" size="sm" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  New post
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground max-w-sm">
                    <Link href={`/admin/blog/${row.id}`} className="hover:text-accent transition-colors">
                      {row.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground font-normal mt-0.5">/blog/{row.slug}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.category || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "published" ? "default" : "secondary"}>
                      {row.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {POST_LANG_LABELS[row.lang as PostLang] ?? row.lang}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {/* Published posts are dated by their publication day;
                    a draft has never had one, so it shows when it was last
                    edited instead — the same value the list is sorted by. */}
                    {row.publishedAt ? formatDate(row.publishedAt) : `Edited ${formatDate(row.updatedAt)}`}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Link href={`/admin/blog/${row.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-600"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(row);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.title}” will be removed permanently. This can't be undone.
              {pendingDelete?.status === "published" &&
                " It's currently published, so its page will come down from the site."}
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={remove.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && remove.mutate({ id: pendingDelete.id })}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
