import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, qs } from "../api/client";
import type { CourseBrief } from "../api/types";
import { Faq } from "../components/Faq";
import { SITE_FAQS } from "../lib/faqs";
import { useSeo } from "../lib/seo";

export function Catalogue() {
  const [rows, setRows] = useState<CourseBrief[]>([]);
  const [cat, setCat] = useState<"all" | "AI" | "Technology">("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: "Course catalogue — 30 AI and technology tracks",
    description: "All thirty tracks: ten AI and twenty technology. Every one is 60 classes of three hours with a capstone, on five weekday timings and four six-hour weekend windows.",
    keywords: ["technology courses", "AI courses", "cybersecurity", "cloud", "data engineering", "devops"],
    faqs: SITE_FAQS,
  });

  useEffect(() => {
    setLoading(true);
    api.get<CourseBrief[]>(`/courses${qs({ category: cat })}`)
      .then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [cat]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter((c) =>
      c.title.toLowerCase().includes(n) || c.roles.toLowerCase().includes(n) ||
      c.tagline.toLowerCase().includes(n));
  }, [rows, q]);

  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="head">
            <span className="kicker">Catalogue</span>
            <h2>All <em className="hl">thirty tracks</em>.</h2>
            <p className="sub">Ten AI tracks and twenty technology tracks. Each is 60 classes of three hours with a defended capstone.</p>
          </div>

          <div className="row between" style={{ marginBottom: 22 }}>
            <div className="seg" role="group" aria-label="Filter by category">
              {(["all", "AI", "Technology"] as const).map((k) => (
                <button key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>
                  {k === "all" ? "All 30" : k === "AI" ? "AI Skills" : "Technology"}
                </button>
              ))}
            </div>
            <input className="in" style={{ maxWidth: 340 }} type="search" value={q}
                   onChange={(e) => setQ(e.target.value)}
                   placeholder="Filter by title, role or tool…" aria-label="Filter tracks" />
          </div>

          {err && <div className="empty"><b>Could not load the catalogue</b>{err}</div>}
          {loading && !err && <p className="ash">Loading tracks…</p>}

          <div className="grid g3">
            {shown.map((c) => (
              <article className="card" key={c.code}>
                <div className="row between">
                  <span className="mono ash">{c.code}</span>
                  <span className={`chip ${c.category === "AI" ? "ai" : "tech"}`}>
                    {c.category === "AI" ? "AI Skills" : "Technology"}
                  </span>
                </div>
                <h3 style={{ marginTop: 12 }}>
                  <Link to={`/courses/${c.code}`} style={{ color: "var(--chalk)" }}>{c.title}</Link>
                </h3>
                <p className="ash" style={{ fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>{c.tagline}</p>
                <p className="mono ash" style={{ marginTop: 12 }}>FOR {c.roles.toUpperCase()}</p>
                <div style={{ marginTop: 16 }}>
                  <Link className="btn sm primary" to={`/courses/${c.code}`}>View &amp; enrol</Link>
                </div>
              </article>
            ))}
          </div>

          {!loading && !shown.length && !err && (
            <div className="empty"><b>Nothing matches that filter</b>Try a different word, or clear the search.</div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="head">
            <span className="kicker">Common questions</span>
            <h2>Before you <em className="hl">pick a track</em></h2>
          </div>
          <Faq items={SITE_FAQS} />
        </div>
      </section>
    </>
  );
}
