import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-[30rem] rounded-lg border border-slate-300 bg-white p-4 sm:p-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>

      <div className="mt-4">{children}</div>

      {footer ? <div className="mt-4 border-t border-slate-200 pt-3">{footer}</div> : null}
    </section>
  );
}
