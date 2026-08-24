/** Shared calendar event text (Google API + .ics). */

export function sessionEventSummary(
  courseName: string,
  sessionTitle: string
): string {
  return `${courseName} - ${sessionTitle}`;
}

export function buildCalendarEventDescription(input: {
  courseName: string;
  instructorName?: string;
  meetingUrl?: string | null;
  location?: string | null;
  sessionDetails?: string;
}): string {
  const lines: string[] = [`Course: ${input.courseName}`];
  if (input.instructorName?.trim()) {
    lines.push(`Instructor: ${input.instructorName.trim()}`);
  }
  if (input.meetingUrl?.trim()) {
    lines.push(`Meeting URL: ${input.meetingUrl.trim()}`);
  }
  if (input.location?.trim()) {
    lines.push(`Location: ${input.location.trim()}`);
  }
  if (input.sessionDetails?.trim()) {
    lines.push("", "Session details:", input.sessionDetails.trim());
  }
  return lines.join("\n");
}
