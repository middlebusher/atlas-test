import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Modern Stack
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#sunburst"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            PR Sunburst
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Button size="sm" asChild href="#cta">
            Get started
          </Button>
        </nav>
      </div>
    </header>
  );
}
