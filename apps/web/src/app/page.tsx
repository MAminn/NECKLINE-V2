export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg text-text-primary">
      <h1 className="font-display text-6xl uppercase tracking-wide text-primary">
        NECKLINE
      </h1>
      <p className="mt-4 text-text-secondary">
        Phase 0 — Foundation
      </p>
      <div className="mt-8 flex gap-4">
        <div className="h-16 w-16 rounded-lg bg-primary" />
        <div className="h-16 w-16 rounded-lg bg-surface" />
        <div className="h-16 w-16 rounded-lg bg-surface-elevated" />
      </div>
    </main>
  );
}
