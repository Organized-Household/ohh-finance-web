import AcceptInviteForm from "./accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-900">
            OH
          </div>
          <h1 className="text-xl font-semibold text-white">
            Complete your registration
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Set your name and password to join the household.
          </p>
        </div>

        <AcceptInviteForm />
      </div>
    </div>
  );
}
