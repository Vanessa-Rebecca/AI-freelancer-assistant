// Form-level message (wrong password, rate limited, server down, out of credits)
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
    >
      {message}
    </div>
  );
}
