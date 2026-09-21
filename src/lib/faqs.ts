import type { CourseDetail } from "../api/types";
import type { FaqItem } from "../components/Faq";

export const SITE_FAQS: FaqItem[] = [
  { q: "How long is a programme, and how many hours is that?",
    a: "Every track is 60 classes of three hours — 180 contact hours. On weekdays that is one class a day, Monday to Friday, for twelve weeks. At weekends it is a single six-hour sitting on Saturday and Sunday, two classes back to back, across fifteen weekends. The syllabus is identical either way.",
    tags: ["duration", "weekend batches", "contact hours"] },
  { q: "What times can I study?",
    a: "Nine windows. On weekdays: 6–9 AM, 9 AM–12 PM, 12–3 PM, 3–6 PM and 6–9 PM. At weekends: 6 AM–12 PM, 9 AM–3 PM, 12–6 PM and 3–9 PM. You pick the timing when you choose your batch, and it does not change what you are taught.",
    tags: ["class timings", "flexible schedule", "evening classes"] },
  { q: "Can I do this while working full time?",
    a: "That is what the early-morning, evening and weekend batches exist for. The weekend pattern in particular is built for people in full-time work — no leave to book, and the whole syllabus.",
    tags: ["working professionals", "part-time study", "weekend bootcamp"] },
  { q: "What is the difference between the Professional and Career programmes?",
    a: "Both run the same 60 classes and the same assessment. The Career programme adds a supervised six-month internship on a live project after the last class, so you finish with work an employer can interrogate rather than a certificate that records attendance.",
    tags: ["internship", "career programme", "placement"] },
  { q: "Do I need a technical background to start?",
    a: "It depends on the track. Several are written for complete beginners and career changers; others assume you already work in technology. Each track page states its own prerequisite, and the course finder will not recommend something two levels above where you are.",
    tags: ["beginners", "prerequisites", "career change"] },
  { q: "What do I actually get besides the classes?",
    a: "Three months of LinkedIn Learning Premium, stated as worth INR 25,000, included with enrolment. Beyond that: every artefact you build — repositories, runbooks, architecture notes, pipelines, dashboards — and a capstone you have defended in front of a panel.",
    tags: ["linkedin learning", "portfolio", "included"] },
];

const LEVEL_LINE: Record<string, string> = {
  entry: "It starts from the beginning — no prior technical experience is assumed.",
  mid: "It assumes you already have hands-on technical experience; this is not a first course.",
  adv: "It is an advanced track. You should already be senior in a related area before taking it.",
};

/** Built from the track's own record, so every answer is specific and stays
 *  true if the curriculum changes. */
export function courseFaqs(c: CourseDetail, batchCount: number,
                           weekday: number, weekend: number): FaqItem[] {
  const level = LEVEL_LINE[String((c.tags as { l?: string })?.l ?? "")] ??
    "Check the prerequisite before enrolling.";
  const tools = c.tools ?? [];
  return [
    { q: `Who is the ${c.title} track for?`, a: `${c.roles}. ${level}`,
      tags: ["who it is for", c.category === "AI" ? "ai skills" : "technology"] },
    { q: `What do I need to know before I start ${c.title}?`, a: c.prereq,
      tags: ["prerequisites", "getting started"] },
    { q: "Which tools will I actually use on this track?",
      a: `${tools.slice(0, 10).join(", ")}${tools.length > 10 ? `, and ${tools.length - 10} more` : ""}. These are the production tools, not a simplified teaching environment.`,
      tags: ["tools", "software", "hands-on"] },
    { q: `How is ${c.title} assessed?`,
      a: `${c.assessment} Across the programme that means a checkpoint at the end of each of the twelve modules, a full assessed review at class 30, and a capstone defended before a panel in the final week. Attendance on its own earns nothing.`,
      tags: ["assessment", "certification"] },
    { q: "What is the capstone project?", a: c.capstone,
      tags: ["capstone", "final project", "portfolio"] },
    { q: `How long does ${c.title} take, and when do classes run?`,
      a: `60 classes of three hours — 180 contact hours. Twelve weeks on the weekday pattern, or fifteen weekends at six hours a day. There are currently ${batchCount} open batches on this track: ${weekday} on weekdays across five timings and ${weekend} at weekends across four.`,
      tags: ["duration", "schedule", "batches"] },
    { q: `What jobs does ${c.title} lead to?`,
      a: `Graduates go into roles such as ${c.roles.toLowerCase()}. The course finder maps the track against your own five-year answer.`,
      tags: ["careers", "job roles"] },
    { q: `Is there an internship with ${c.title}?`,
      a: "Yes, on the Career programme. It runs the same 60 classes, then a supervised six-month internship on a live project with real deliverables and review cycles. The Professional programme is the same teaching without the internship.",
      tags: ["internship", "work experience"] },
  ];
}
