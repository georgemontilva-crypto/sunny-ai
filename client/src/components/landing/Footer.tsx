import { Mail, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border/50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src="/logo.png" alt="Sunny" className="h-10 w-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              AI-powered peptide research. Educational content, research-backed guidance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Compounds</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Research</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Sunny. Educational research content. Not medical advice. For adults 21+.
          </p>
        </div>
      </div>
    </footer>
  );
}
