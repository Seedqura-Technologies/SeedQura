import { FellowshipEnrollClient } from "./FellowshipEnrollClient";
import { EnrollClient } from "./EnrollClient";
import { isResearchFellowship } from "@/lib/fellowship";

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <main className="flex min-h-screen items-start px-4 py-20 sm:items-center sm:py-28">
      {isResearchFellowship(courseId) ? (
        <FellowshipEnrollClient />
      ) : (
        <EnrollClient courseId={courseId} />
      )}
    </main>
  );
}
