type InlineErrorMessageProps = {
  id: string;
  message?: string;
};

export default function InlineErrorMessage({
  id,
  message,
}: InlineErrorMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-xs text-rose-700">
      {message}
    </p>
  );
}
