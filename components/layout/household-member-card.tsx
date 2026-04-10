type HouseholdMemberCardProps = {
  firstName: string;
};

export default function HouseholdMemberCard({ firstName }: HouseholdMemberCardProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
      <p className="font-semibold text-slate-800">{firstName}</p>
      <p className="mt-1">
        Member switching logic will be added in a future phase.
      </p>
    </div>
  );
}
