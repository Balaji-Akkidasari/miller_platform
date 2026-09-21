export type Role = "student" | "trainer" | "admin";

export interface User { id: number; email: string; name: string; role: Role; phone?: string | null }
export interface TokenResponse { access_token: string; token_type: string; user: User }

export interface CourseBrief {
  code: string; slug: string; title: string; category: string; tagline: string; roles: string;
}
export interface CourseDetail extends CourseBrief {
  about: string; prereq: string; assessment: string; capstone: string;
  tools: string[]; outcomes: string[];
  modules: { id: string; title: string; days: string; desc: string }[];
  tags: Record<string, unknown>;
}
export interface Batch {
  id: number; code: string; pattern: "WD" | "WE"; slot_key: string;
  programme: "CORE" | "INTERN"; starts_on: string; classes_end_on: string;
  internship_end_on: string | null; mode: string; seats: number;
  seats_taken: number; classes_held: number; is_staffed: boolean;
  course_code?: string | null; course_title?: string | null;
}
export interface Slot {
  key: string; label: string; short: string; name: string; hours: number; weekend: boolean;
}
export interface Meta {
  slots: Slot[];
  patterns: { key: string; label: string; weeks: number; classes_per_day: number; days: string }[];
  programmes: { key: string; label: string; internship_weeks: number }[];
  class_hours: number; class_count: number; contact_hours: number;
}
export interface PlanEntry {
  n: number; module_id: string | null; module_title: string | null;
  title: string; kind: "taught" | "checkpoint" | "review" | "capstone";
  blocks: string[]; on_date: string | null;
}
export interface FinderResult {
  course: CourseBrief; fit: number; points: number;
  why: { kind: string; text: string }[]; matching_batches: number;
}
export interface PathStep {
  when: string; note: string; fit: number; level: string;
  course_code: string; course_title: string;
}
export interface Enrolment { id: number; status: string; created_at: string; batch: Batch }
export interface Candidate {
  trainer_id: number; name: string; email: string; headline: string; score: number;
  eligible: boolean; reasons: string[]; load: number; capacity: number;
  rating: number | null; rating_count: number; expressed_interest: boolean;
}
export interface Lead {
  id: number; kind: string; name: string; email: string; phone: string;
  organisation: string; preferred_time: string; note: string; state: string; created_at: string;
}
