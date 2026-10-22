import type { ReactNode } from 'react';

// Temporary page body until each real page is built (Steps 1.17 and 1.21)
export function PlaceholderPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="mt-4 text-muted">{children ?? 'Coming soon.'}</div>
      </div>
    </main>
  );
}
