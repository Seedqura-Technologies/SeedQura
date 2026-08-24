import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademyFooter } from "@/components/academy/AcademyFooter";
import { AcademyCourseDetailView } from "@/components/academy/AcademyCourseDetailView";
import {
  getLabCourseDetail,
  getLabCourseDetailIds,
} from "@/content/academy/lab-courses";
import { getCourses } from "@/lib/data";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export function generateStaticParams() {
  return getLabCourseDetailIds().map((courseId) => ({ courseId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const detail = getLabCourseDetail(courseId);
  const course = getCourses().find((c) => c.id === courseId);
  if (!detail || !course) {
    return { title: "Course — Seedqura Academy" };
  }
  return {
    title: `${course.name} — Seedqura Academy`,
    description: course.description,
  };
}

export default async function AcademyCoursePage({ params }: PageProps) {
  const { courseId } = await params;
  const detail = getLabCourseDetail(courseId);
  if (!detail) notFound();

  return (
    <>
      <AcademyHeader />
      <main>
        <AcademyCourseDetailView courseId={courseId} detail={detail} />
      </main>
      <AcademyFooter />
    </>
  );
}
