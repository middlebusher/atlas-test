import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-foreground">
            Modern Stack
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Built with Next.js 16, React 19, TypeScript & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
