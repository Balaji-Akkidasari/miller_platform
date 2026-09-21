import { useEffect } from "react";

import type { FaqItem } from "../components/Faq";

const SUFFIX = "Miller Institute of Technology";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}

function ensure(tag: string, attrs: Record<string, string>): Element {
  const key = Object.entries(attrs).map(([k, v]) => `[${k}="${v}"]`).join("");
  let el = document.head.querySelector(`${tag}${key}`);
  if (!el) {
    el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  return el;
}

export interface Seo {
  title?: string;
  description?: string;
  keywords?: string[];
  faqs?: FaqItem[];
  course?: { title: string; tagline: string; tools: string[]; outcomes: string[]; prereq: string };
}

/** Real per-route metadata. Unlike the hash-routed prototype these are
 *  distinct URLs, so crawlers can index each page separately. */
export function useSeo(seo: Seo, deps: unknown[] = []) {
  useEffect(() => {
    document.title = seo.title ? `${seo.title} — ${SUFFIX}` : `${SUFFIX} — industry training on live projects`;
    if (seo.description) {
      setMeta('meta[name="description"]', "content", seo.description);
      ensure("meta", { property: "og:description" }).setAttribute("content", seo.description);
    }
    ensure("meta", { property: "og:title" }).setAttribute("content", document.title);
    if (seo.keywords?.length) {
      ensure("meta", { name: "keywords" }).setAttribute("content", seo.keywords.join(", "));
    }
    ensure("link", { rel: "canonical" }).setAttribute("href", window.location.origin + window.location.pathname);

    const graph: unknown[] = [];
    if (seo.faqs?.length) {
      graph.push({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: seo.faqs.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    if (seo.course) {
      graph.push({
        "@context": "https://schema.org", "@type": "Course",
        name: seo.course.title, description: seo.course.tagline,
        provider: { "@type": "EducationalOrganization", name: SUFFIX },
        about: seo.course.tools.slice(0, 12),
        teaches: seo.course.outcomes.slice(0, 6),
        coursePrerequisites: seo.course.prereq,
        hasCourseInstance: [
          { "@type": "CourseInstance", courseMode: "Blended", courseWorkload: "PT180H",
            courseSchedule: { "@type": "Schedule", repeatFrequency: "Daily",
              byDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], duration: "PT3H" } },
          { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT180H",
            courseSchedule: { "@type": "Schedule", repeatFrequency: "Weekly",
              byDay: ["Saturday", "Sunday"], duration: "PT6H" } },
        ],
      });
    }
    const node = ensure("script", { type: "application/ld+json", id: "ld-page" });
    node.textContent = JSON.stringify(graph.length === 1 ? graph[0] : graph).replace(/</g, "\\u003c");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
