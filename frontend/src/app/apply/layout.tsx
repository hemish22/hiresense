import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — HireSense",
  description: "Apply to open roles. Submit your resume and our team will review your profile.",
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="w-full border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto max-w-4xl flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              H
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">HireSense</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Careers</div>
            </div>
          </div>
          <a href="/apply/status" className="text-sm text-muted-foreground hover:text-foreground">
            Check status
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HireSense · Equal opportunity employer
      </footer>
    </div>
  );
}
