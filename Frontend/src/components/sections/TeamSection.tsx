"use client";

import Image from "next/image";
import { getTeamMembers } from "@/lib/data";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

const GROUPS = [
  {
    id: "leadership",
    label: "Leadership",
    title: "Founder & advisor",
  },
  {
    id: "research",
    label: "Research",
    title: "Research team",
  },
] as const;

function MemberCard({
  member,
}: {
  member: ReturnType<typeof getTeamMembers>[number];
}) {
  return (
    <article className="mx-auto flex h-full w-full max-w-[200px] flex-col items-center text-center">
      <div className="relative mb-5 aspect-square w-full overflow-hidden rounded-2xl bg-white/4 ring-1 ring-white/8">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            sizes="200px"
            quality={88}
            unoptimized
            className="object-cover object-[center_18%]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-white/6 to-transparent">
            <span className="text-2xl font-medium tracking-wide text-muted">
              {member.initials}
            </span>
          </div>
        )}
      </div>

      <h3 className="text-base font-medium tracking-tight text-text sm:text-lg">
        {member.name}
      </h3>
      <p className="mt-2 min-h-[2.75rem] text-sm leading-snug text-muted">
        {member.role}
      </p>
    </article>
  );
}

export function TeamSection() {
  const members = getTeamMembers();

  return (
    <section className="section-padding relative border-t border-white/6">
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-accent">
              People
            </p>
            <h2 className="text-3xl font-medium tracking-tight text-text md:text-4xl">
              The team
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
              Research and product — a small group building Seedqura.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-20 space-y-20">
          {GROUPS.map((group) => {
            const groupMembers = members.filter((m) => m.group === group.id);
            if (!groupMembers.length) return null;

            return (
              <div key={group.id}>
                <ScrollReveal>
                  <div className="mb-10 text-center">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                      {group.label}
                    </p>
                    <h3 className="mt-3 text-xl font-medium tracking-tight text-text md:text-2xl">
                      {group.title}
                    </h3>
                  </div>
                </ScrollReveal>

                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2">
                  {groupMembers.map((member, i) => (
                    <ScrollReveal key={member.id} delay={i * 0.06}>
                      <MemberCard member={member} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
