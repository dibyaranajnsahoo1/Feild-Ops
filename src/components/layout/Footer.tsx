import Link from "next/link";
import { Github, Linkedin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
      <p>
        Developed by <span className="font-semibold text-foreground">Dibya ranjan sahoo</span>
      </p>
      <div className="flex items-center gap-6">
        <Link 
          href="https://github.com/dibyaranajnsahoo1" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Github className="h-4 w-4" />
          <span>GitHub</span>
        </Link>
        <Link 
          href="https://www.linkedin.com/in/dibya-ranjan-sahoo-5469431a4" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </Link>
        <Link 
          href="https://dibya-ranjan.vercel.app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <Globe className="h-4 w-4" />
          <span>Portfolio</span>
        </Link>
      </div>
    </footer>
  );
}
