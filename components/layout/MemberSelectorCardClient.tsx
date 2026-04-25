"use client";

import { useState } from "react";

export type MemberItem = {
  userId: string;
  displayLabel: string;
};

type MemberSelectorCardClientProps = {
  members: MemberItem[];
  currentUserId: string;
};

export default function MemberSelectorCardClient({
  members,
  currentUserId,
}: MemberSelectorCardClientProps) {
  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    if (typeof window === "undefined") return currentUserId;
    return localStorage.getItem("active-member-id") ?? currentUserId;
  });

  const handleSetActiveMember = (userId: string) => {
    setActiveMemberId(userId);
    localStorage.setItem("active-member-id", userId);
  };

  // Solo household — display only, no interactive selection needed
  if (members.length <= 1) {
    const solo = members[0];
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">
          {solo?.displayLabel ?? "Member"}
        </p>
        <p className="mt-1 text-slate-500">
          Add household members via Settings → Members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {members.map((m) => {
        const isCurrentUser = m.userId === currentUserId;
        const isActive = m.userId === activeMemberId;

        return (
          <button
            key={m.userId}
            type="button"
            onClick={() => handleSetActiveMember(m.userId)}
            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition ${
              isActive
                ? "bg-slate-200 font-medium text-slate-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>{m.displayLabel}</span>
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-slate-400">(you)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
