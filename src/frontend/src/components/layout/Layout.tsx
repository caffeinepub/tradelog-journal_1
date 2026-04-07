import { Toaster } from "@/components/ui/sonner";
import type React from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="dark min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main
          className="flex-1 p-4 md:p-6 overflow-auto"
          data-ocid="main-content"
        >
          {children}
        </main>
        <footer className="px-6 py-3 border-t border-border bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff41]/70 hover:text-[#00ff41] transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
