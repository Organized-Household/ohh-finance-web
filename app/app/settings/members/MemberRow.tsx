"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRole, removeMember } from "./actions";

function UserMinusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

interface MemberRowProps {
  member: {
    user_id: string;
    role: string;
    display_name: string;
    email: string | null;
    joined: string;
  };
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  adminCount: number;
}

export default function MemberRow({
  member,
  currentUserId,
  isCurrentUserAdmin,
  adminCount,
}: MemberRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isCurrentUser = member.user_id === currentUserId;

  const handleRoleChange = (newRole: string) => {
    startTransition(async () => {
      const result = await updateMemberRole(
        member.user_id,
        newRole as "admin" | "member"
      );
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeMember(member.user_id);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  const isRoleDropdownDisabled =
    isCurrentUser ||
    (member.role === "admin" && adminCount <= 1) ||
    (member.role === "member" && adminCount >= 2) ||
    isPending;

  const tdCls = "px-3 py-2 text-sm text-slate-700";

  return (
    <tr className={isPending ? "opacity-50" : ""}>
      {/* NAME */}
      <td className={tdCls}>
        <span className="font-medium text-slate-900">{member.display_name}</span>
        {isCurrentUser && (
          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            you
          </span>
        )}
        {member.email && (
          <div className="text-xs text-slate-500">{member.email}</div>
        )}
      </td>

      {/* ROLE */}
      <td className={tdCls}>
        {isCurrentUserAdmin && !isCurrentUser ? (
          <select
            value={member.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isRoleDropdownDisabled}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm
              disabled:cursor-not-allowed disabled:opacity-50"
            title={
              member.role === "member" && adminCount >= 2
                ? "Maximum 2 admins reached"
                : member.role === "admin" && adminCount <= 1
                ? "Cannot demote last admin"
                : undefined
            }
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span className="capitalize">{member.role}</span>
        )}
      </td>

      {/* JOINED */}
      <td className={tdCls}>{member.joined}</td>

      {/* ACTIONS */}
      {isCurrentUserAdmin && (
        <td className={tdCls}>
          {!isCurrentUser && (
            <button
              onClick={handleRemove}
              disabled={isPending}
              title="Remove member"
              className="cursor-pointer text-red-500 hover:text-red-700
                disabled:opacity-40"
            >
              <UserMinusIcon />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
