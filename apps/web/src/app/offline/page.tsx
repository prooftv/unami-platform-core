export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">You're offline</h1>
      <p className="text-muted-foreground max-w-sm">
        No internet connection. Check your connection and try again.
      </p>
      <a href="/" className="text-sm underline underline-offset-4">
        Try again
      </a>
    </div>
  );
}
