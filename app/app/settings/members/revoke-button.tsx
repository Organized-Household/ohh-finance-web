"use client";

import { useTransition } from "react";
import { revokeInvitation } from "./actions";

export default function RevokeButton({ invitationId }: { invitationId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeInvitation(invitationId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={isPending}
      className="cursor-pointer text-xs text-rose-600 hover:text-rose-800 disabled:opacity-40"
    >
      {isPending ? "Revoking…" : "Revoke"}
    </button>
  );
}
