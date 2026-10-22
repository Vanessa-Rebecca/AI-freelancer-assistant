import { Button } from './Button.tsx';

// Shown in place of content when a query fails
export function QueryError({
  message = "Couldn't load this.",
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 py-2 text-sm">
      <p className="text-danger">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
        Try again
      </Button>
    </div>
  );
}
