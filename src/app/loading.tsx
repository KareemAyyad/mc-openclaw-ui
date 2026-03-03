export default function Loading() {
  return (
    <div className="min-h-screen bg-mc-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-mc-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-mc-text-secondary">Loading Mission Control...</span>
      </div>
    </div>
  );
}
