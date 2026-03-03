import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-mc-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-mc-bg-secondary border border-mc-border rounded-lg p-6 text-center">
        <div className="text-6xl font-bold text-mc-accent mb-2">404</div>
        <h2 className="text-lg font-semibold text-mc-text mb-2">Page Not Found</h2>
        <p className="text-sm text-mc-text-secondary mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-mc-accent text-mc-bg rounded text-sm font-medium hover:bg-mc-accent/90"
        >
          Back to Mission Control
        </Link>
      </div>
    </div>
  );
}
