"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeInvitation } from "./actions";

export default function RevokeButton({ invitationId }: { invitationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokeInvitation(invitationId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
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
