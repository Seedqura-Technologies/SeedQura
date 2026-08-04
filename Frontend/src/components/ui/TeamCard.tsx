import type { TeamMember } from "@/lib/data";

export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-bg-gray text-xl font-semibold text-text-muted">
        {member.initials}
      </div>
      <h3 className="text-lg font-bold text-text-primary">{member.name}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
      <p className="mt-2 text-sm text-text-muted">{member.bio}</p>
    </div>
  );
}
