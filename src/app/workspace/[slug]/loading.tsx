export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-mc-bg">
      {/* Header skeleton */}
      <div className="h-14 bg-mc-bg-secondary border-b border-mc-border flex items-center px-4 gap-4">
        <div className="h-5 w-32 bg-mc-bg-tertiary rounded animate-pulse" />
        <div className="h-5 w-24 bg-mc-bg-tertiary rounded animate-pulse" />
        <div className="flex-1" />
        <div className="h-5 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
      </div>

      <div className="flex flex-1" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Agent sidebar skeleton */}
        <div className="w-64 bg-mc-bg-secondary border-r border-mc-border p-3 space-y-3">
          <div className="h-4 w-20 bg-mc-bg-tertiary rounded animate-pulse" />
          <div className="flex gap-1">
            <div className="h-8 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
            <div className="h-8 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
            <div className="h-8 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-mc-bg-tertiary rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-mc-bg-tertiary rounded animate-pulse" />
                <div className="h-2 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-3">
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 min-w-[220px] max-w-[300px] bg-mc-bg rounded-lg border border-mc-border/50">
                <div className="p-2 border-b border-mc-border">
                  <div className="h-3 w-16 bg-mc-bg-tertiary rounded animate-pulse" />
                </div>
                <div className="p-2 space-y-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="bg-mc-bg-secondary border border-mc-border/50 rounded-lg p-3 space-y-2">
                      <div className="h-3 w-full bg-mc-bg-tertiary rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-mc-bg-tertiary rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
