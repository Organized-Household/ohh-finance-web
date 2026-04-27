"use client";

import { useRouter } from "next/navigation";

export type MemberItem = {
  userId: string;
  displayLabel: string;
};

type MemberSelectorCardClientProps = {
  members: MemberItem[];
  currentUserId: string;
  isAdmin: boolean;
  activeMemberId: string;
};

export default function MemberSelectorCardClient({
  members,
  currentUserId,
  isAdmin,
  activeMemberId,
}: MemberSelectorCardClientProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin) return;
    const newId = e.target.value;
    // Persist to localStorage so sidebar links can read it on next render
    try {
      localStorage.setItem("active-member-id", newId);
    } catch {
      // localStorage unavailable in some environments — silently ignore
    }
    // Push ?member=uuid so the server re-renders with the selected member's data
    const url = new URL(window.location.href);
    url.searchParams.set("member", newId);
    router.push(url.toString());
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

  if (isAdmin) {
    return (
      <select
        value={activeMemberId}
        onChange={handleChange}
        className="w-full cursor-pointer rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.displayLabel}
            {m.userId === currentUserId ? " (you)" : ""}
          </option>
        ))}
      </select>
    );
  }

  // Non-admin: locked display showing own name
  const selfMember = members.find((m) => m.userId === currentUserId) ?? members[0];
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
      {selfMember?.displayLabel ?? "Member"}
      <span className="ml-1 text-xs text-slate-400">(you)</span>
    </div>
  );
}
