import { AlertCircle, AlertTriangle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMemberAuth } from "@/hooks/useMemberAuth";
import { trpc } from "@/lib/trpc";

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const changePassword = trpc.member.changePassword.useMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold mb-1">Change password</h2>
      <p className="text-sm text-muted-foreground mb-5">Requires your current password.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current password</label>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-lg border-border/60 focus:border-accent/50"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New password</label>
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-lg border-border/60 focus:border-accent/50"
            required
          />
          <PasswordStrengthMeter password={newPassword} />
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <Button type="submit" disabled={changePassword.isPending || newPassword.length < 8 || !currentPassword}>
          {changePassword.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

function DeleteHistoryCard() {
  const [open, setOpen] = useState(false);
  const deleteHistory = trpc.member.deleteConversationHistory.useMutation();

  const handleConfirm = async () => {
    try {
      await deleteHistory.mutateAsync();
      toast.success("Your conversation history has been deleted.");
      setOpen(false);
    } catch {
      toast.error("Couldn't delete your history. Please try again.");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold mb-1">Conversation history</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Permanently deletes every conversation you've had with Sunny. This can't be undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Delete conversation history</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation history?</DialogTitle>
            <DialogDescription>
              This permanently deletes everything you've told Sunny. It can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={deleteHistory.isPending}>
              {deleteHistory.isPending ? "Deleting…" : "Delete history"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [, setLocation] = useLocation();
  const deleteAccount = trpc.member.deleteAccount.useMutation();

  const handleConfirm = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success("Your account and all its data have been deleted.");
      setLocation("/");
    } catch {
      toast.error("Couldn't delete your account. Please try again.");
    }
  };

  return (
    <Card className="p-6 border-red-200">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <h2 className="text-base font-semibold">Delete account</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Permanently deletes your account, your conversations, and everything else tied to it. This can't be undone.
      </p>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmEmail("");
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive">Delete account</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, your conversation history, and everything else tied to
              it. It can't be undone. Type <span className="font-mono text-foreground">{email}</span> to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={email}
            className="rounded-lg border-border/60 focus:border-accent/50"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirmEmail !== email || deleteAccount.isPending}
            >
              {deleteAccount.isPending ? "Deleting…" : "Delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function AccountPage() {
  const { user } = useMemberAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 px-4 pt-24 pb-16">
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Account</h1>
            {user && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
          </div>

          <ChangePasswordCard />
          <DeleteHistoryCard />
          {user && <DeleteAccountCard email={user.email} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
