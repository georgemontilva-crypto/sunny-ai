import { type FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";

export default function AdminUsersPage() {
  const { user: me } = useAdminAuth();
  const utils = trpc.useUtils();
  const { data, isLoading, isError } = trpc.users.list.useQuery();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [inviteError, setInviteError] = useState("");
  const [invited, setInvited] = useState<{ email: string; tempPassword: string } | null>(null);
  const [rowError, setRowError] = useState("");

  const invite = trpc.users.invite.useMutation({
    onSuccess: (result) => {
      setInvited({ email: result.email, tempPassword: result.tempPassword });
      setEmail("");
      utils.users.list.invalidate();
    },
    onError: (err) => setInviteError(err.message),
  });
  const setRoleMutation = trpc.users.setRole.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
    onError: (err) => setRowError(err.message),
  });
  const setActive = trpc.users.setActive.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
    onError: (err) => setRowError(err.message),
  });

  const handleInvite = (e: FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInvited(null);
    invite.mutate({ email, role });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Users</h1>

      <Card className="p-5 mb-6 max-w-xl">
        <p className="text-sm font-semibold text-foreground mb-3">Invite someone</p>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border-border/60 focus:border-accent/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "editor")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? "Inviting…" : "Invite"}
          </Button>
        </form>

        {inviteError && <p className="text-sm text-red-600 mt-3">{inviteError}</p>}

        {invited && (
          <div className="mt-4 rounded-lg border border-border/60 bg-secondary/40 p-3 text-sm">
            <p className="text-foreground">
              Account created for <strong>{invited.email}</strong>. There's no email sending set up on the server
              yet, so share this one-time password with them yourself — it won't be shown again:
            </p>
            <code className="block mt-2 text-xs bg-card border border-border/60 rounded px-2 py-1 select-all">
              {invited.tempPassword}
            </code>
          </div>
        )}
      </Card>

      {rowError && <p className="text-sm text-red-600 mb-3">{rowError}</p>}

      <Card className="overflow-hidden py-0">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading users…</div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-foreground">We couldn't load the team. Try again.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-foreground">
                      {u.email} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => setRoleMutation.mutate({ id: u.id, role: v as "admin" | "editor" })}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "secondary" : "outline"}>{u.isActive ? "Active" : "Deactivated"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.lastLoginAt ? new Date(u.lastLoginAt as unknown as string).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSelf}
                        onClick={() => setActive.mutate({ id: u.id, isActive: !u.isActive })}
                      >
                        {u.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
