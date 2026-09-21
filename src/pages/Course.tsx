import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { api, qs } from "../api/client";
import { useAuth } from "../api/auth";
import type { Batch, CourseDetail, Meta, PlanEntry } from "../api/types";
import { Faq } from "../components/Faq";
import { useToast } from "../components/Toast";
import { courseFaqs } from "../lib/faqs";
import { useSeo } from "../lib/seo";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function CoursePage() {
  const { code = "" } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [programme, setProgramme] = useState<"CORE" | "INTERN">("CORE");
  const [pattern, setPattern] = useState<"WD" | "WE">("WD");
  const [slot, setSlot] = useState<string>("any");

  useEffect(() => {
    setErr(null);
    Promise.all([
      api.get<CourseDetail>(`/courses/${code}`),
      api.get<Meta>("/meta"),
      api.get<Batch[]>(`/batches${qs({ course: code })}`),
      api.get<PlanEntry[]>(`/courses/${code}/plan`),
    ]).then(([c, m, b, p]) => { setCourse(c); setMeta(m); setBatches(b); setPlan(p); })
      .catch((e) => setErr(e.message));
  }, [code]);

  const weekday = batches.filter((b) => b.pattern === "WD").length;
  const weekend = batches.filter((b) => b.pattern === "WE").length;
  const faqs = useMemo(
    () => (course ? courseFaqs(course, batches.length, weekday, weekend) : []),
    [course, batches.length, weekday, weekend],
  );

  useSeo({
    title: course?.title,
    description: course ? `${course.tagline} 60 classes of three hours, 180 contact hours, nine timings including six-hour weekend sittings.` : undefined,
    keywords: course ? [course.title.toLowerCase(), `${course.title.toLowerCase()} course`, ...course.tools.slice(0, 8).map((t) => t.toLowerCase())] : undefined,
    faqs, course: course ?? undefined,
  }, [course?.code, faqs.length]);

  const slotsAvailable = useMemo(() => {
    const keys = batches.filter((b) => b.pattern === pattern && b.programme === programme)
      .map((b) => b.slot_key);
    return [...new Set(keys)];
  }, [batches, pattern, programme]);

  useEffect(() => {
    if (slot !== "any" && !slotsAvailable.includes(slot)) setSlot("any");
  }, [slotsAvailable, slot]);

  const visible = batches
    .filter((b) => b.pattern === pattern && b.programme === programme && (slot === "any" || b.slot_key === slot))
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));

  const slotLabel = (key: string) => meta?.slots.find((s) => s.key === key)?.label ?? key;

  async function enrol(batch: Batch) {
    if (!user) { toast("Sign in as a student to join a batch."); return; }
    try {
      const r = await api.post<{ message: string }>("/me/enrolments", { batch_id: batch.id });
      toast(r.message);
      setBatches((prev) => prev.map((b) => b.id === batch.id ? { ...b, seats_taken: b.seats_taken + 1 } : b));
    } catch (e) { toast((e as Error).message); }
  }

  if (err) return <div className="wrap section"><div className="empty"><b>Could not load this track</b>{err}</div></div>;
  if (!course) return <div className="wrap section"><p className="ash">Loading…</p></div>;

  return (
    <>
      <section className="section">
        <div className="wrap">
          <div className="row"><span className="mono ash">{course.code}</span>
            <span className={`chip ${course.category === "AI" ? "ai" : "tech"}`}>
              {course.category === "AI" ? "AI Skills" : "Technology"}</span></div>
          <h1 style={{ marginTop: 14, fontSize: "clamp(28px,4.4vw,52px)" }}>{course.title}</h1>
          <p className="lede" style={{ marginTop: 16 }}>{course.tagline}</p>

          <div className="grid g4" style={{ marginTop: 30 }}>
            {[["60", "CLASSES OF 3 HOURS"], ["180", "CONTACT HOURS"],
              ["9", "TIMINGS AVAILABLE"], ["2", "PROGRAMME TYPES"]].map(([v, l]) => (
              <div key={l}><b style={{ display: "block", font: "600 26px var(--sf)" }}>{v}</b>
                <span className="mono ash">{l}</span></div>
            ))}
          </div>

          <div className="grid" style={{ marginTop: 40, gridTemplateColumns: "1fr", gap: 30 }}>
            <div className="card">
              <h3>Choose your batch</h3>

              <div className="stack" style={{ marginTop: 18 }}>
                <div>
                  <span className="mono ash">PROGRAMME</span>
                  <div className="seg" style={{ marginTop: 8 }}>
                    <button className={programme === "CORE" ? "on" : ""} onClick={() => setProgramme("CORE")}>Professional</button>
                    <button className={programme === "INTERN" ? "on" : ""} onClick={() => setProgramme("INTERN")}>Career + internship</button>
                  </div>
                </div>
                <div>
                  <span className="mono ash">PATTERN</span>
                  <div className="seg" style={{ marginTop: 8 }}>
                    <button className={pattern === "WD" ? "on" : ""} onClick={() => setPattern("WD")}>Weekdays</button>
                    <button className={pattern === "WE" ? "on" : ""} onClick={() => setPattern("WE")}>Weekend</button>
                  </div>
                </div>
                <div>
                  <span className="mono ash">TIMING</span>
                  <div className="pills" style={{ marginTop: 8 }}>
                    <button className={`pill ${slot === "any" ? "on" : ""}`} onClick={() => setSlot("any")}>Any time</button>
                    {slotsAvailable.map((k) => (
                      <button key={k} className={`pill ${slot === k ? "on" : ""}`} onClick={() => setSlot(k)}>{slotLabel(k)}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="stack" style={{ marginTop: 22 }}>
                {visible.map((b) => {
                  const left = b.seats - b.seats_taken;
                  return (
                    <div className="card" key={b.id} style={{ background: "var(--void)" }}>
                      <div className="row between">
                        <div>
                          <b style={{ fontSize: 17 }}>{slotLabel(b.slot_key)}</b>
                          <div className="mono ash" style={{ marginTop: 6, lineHeight: 1.7 }}>
                            STARTS {fmt(b.starts_on).toUpperCase()} · {b.pattern === "WD" ? "MON–FRI" : "SAT & SUN"} · {b.mode.toUpperCase()}<br />
                            CLASSES END {fmt(b.classes_end_on).toUpperCase()}
                            {b.internship_end_on && ` · INTERNSHIP TO ${fmt(b.internship_end_on).toUpperCase()}`}<br />
                            {b.seats_taken}/{b.seats} SEATS · {b.code}
                          </div>
                        </div>
                        {left > 0
                          ? <button className="btn sm primary" onClick={() => enrol(b)}>Join this batch</button>
                          : <span className="chip warn">Full</span>}
                      </div>
                    </div>
                  );
                })}
                {!visible.length && <div className="empty"><b>No batch in that combination</b>Try the other pattern or another timing.</div>}
              </div>

              <div className="perk">
                <b>Included free with enrolment</b>
                <span>Three months of LinkedIn Learning Premium, worth INR 25,000, on every batch of every track.</span>
              </div>
            </div>

            <div className="grid g2" style={{ alignItems: "start" }}>
              <div className="card"><h4>What this track is</h4>
                <p className="ash" style={{ marginTop: 10, lineHeight: 1.6 }}>{course.about}</p></div>
              <div className="stack">
                <div className="card"><h4>Who it is for</h4><p className="ash" style={{ marginTop: 10 }}>{course.roles}</p></div>
                <div className="card"><h4>Before you start</h4><p className="ash" style={{ marginTop: 10 }}>{course.prereq}</p></div>
                <div className="card"><h4>Tools you will use</h4>
                  <div className="pills" style={{ marginTop: 12 }}>
                    {course.tools.slice(0, 12).map((t) => <span className="chip" key={t}>{t}</span>)}
                  </div></div>
              </div>
            </div>

            <div>
              <h3>What you will be able to do</h3>
              <ol className="stack" style={{ marginTop: 16, paddingLeft: 20 }}>
                {course.outcomes.map((o) => <li key={o} style={{ fontSize: 16 }}>{o}</li>)}
              </ol>
            </div>

            <div>
              <h3>The sixty-class plan</h3>
              <p className="ash" style={{ marginTop: 8, marginBottom: 16, fontSize: 15 }}>
                Twelve modules of five classes. Class 30 is the mid-programme review; classes 56 to 60 are the capstone.
              </p>
              <div className="plan">
                {plan.map((p) => (
                  <details className="pday" key={p.n}>
                    <summary>
                      <span className="dn">{String(p.n).padStart(2, "0")}</span>
                      <span className="dt"><b>{p.title}</b><span className="dm">{p.module_id} · {p.module_title}</span></span>
                      {p.kind !== "taught" && <span className={`chip ${p.kind === "capstone" ? "good" : "warn"}`}>{p.kind}</span>}
                    </summary>
                    <div className="pbody">
                      {["Concept", "Guided build", "Your lab"].map((h, k) => (
                        <div className="pb" key={h}>
                          <span className="ph">{String(k + 1).padStart(2, "0")} · {h}</span>
                          <p>{p.blocks[k]}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="head">
            <span className="kicker">Common questions</span>
            <h2>Questions about <em className="hl">{course.title}</em></h2>
          </div>
          <Faq items={faqs} />
        </div>
      </section>
    </>
  );
}
