type FormAlertProps = {
  message: string;
  tone?: "error" | "success" | "info";
};

export default function FormAlert({ message, tone = "error" }: FormAlertProps) {
  const toneClass =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-md border px-3 py-2 text-sm ${toneClass}`}
    >
      {message}
    </div>
  );
}
