import { MessageCircle } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemberAuth } from "@/hooks/useMemberAuth";

// The account itself (signup, login, session, deletion) is real —
// conversations with Sunny aren't wired up yet. This is a placeholder
// landing spot so signup has somewhere real to redirect to.
export default function ChatPage() {
  const { user, logout } = useMemberAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="w-7 h-7 text-accent" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold mb-2">Chat with Sunny — coming soon</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {user ? `You're signed in as ${user.email}.` : "You're signed in."} The conversation experience
            isn't live yet — your account is ready for when it is.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/account">Manage account</Link>
            </Button>
            <Button variant="ghost" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
