import { EnrollClient } from "./EnrollClient";

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <main className="flex min-h-screen items-center px-4 py-28">
      <EnrollClient courseId={courseId} />
    </main>
  );
}
