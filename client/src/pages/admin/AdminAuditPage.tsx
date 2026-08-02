import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 25;

export default function AdminAuditPage() {
  const [userId, setUserId] = useState("all");
  const [action, setAction] = useState("all");
  const [page, setPage] = useState(1);

  const usersQuery = trpc.users.list.useQuery();
  const { data, isLoading, isError, refetch } = trpc.audit.list.useQuery({
    userId: userId === "all" ? undefined : userId,
    action: action === "all" ? undefined : action,
    page,
    pageSize: PAGE_SIZE,
  });

  const actions = Array.from(new Set((data?.rows ?? []).map((r) => r.action)));
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Audit log</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={userId}
          onValueChange={(v) => {
            setUserId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {usersQuery.data?.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden py-0">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading the audit log…</div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-foreground">We couldn't load the audit log.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-foreground">No actions match these filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(row.createdAt as unknown as string).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {usersQuery.data?.find((u) => u.id === row.userId)?.email ?? row.userId ?? "—"}
                  </TableCell>
                  <TableCell className="text-foreground">{row.action}</TableCell>
                  <TableCell className="text-muted-foreground">{row.entity ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.rows.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {totalPages} · {data.total} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
