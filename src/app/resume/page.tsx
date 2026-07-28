import { redirect } from "next/navigation";
import { findResume } from "@/lib/resume";

/**
 * There is no wrapper page for the resume: /resume sends the browser straight
 * to the PDF so its own viewer handles it. 404s while no PDF exists.
 */
export default function ResumePage() {
  const resume = findResume();
  if (!resume) redirect("/");
  redirect(resume.href);
}
