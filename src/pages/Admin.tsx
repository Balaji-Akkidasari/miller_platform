import { useCallback, useEffect, useState } from "react";

import { api, qs } from "../api/client";
import { useAuth } from "../api/auth";
import type { Batch, Candidate, CourseBrief, Lead, PlanEntry } from "../api/types";
import { useToast } from "../components/Toast";
import { useSeo } from "../lib/seo";

interface Overview {
  registrations: number; students: number; trainers: number; batches: number;
  staffed: number; covers: number; ratings: number; new_leads: number;
}
interface RegGroup {
  course_code: string; course_title: string;
  batches: { batch_code: string; batch_id: number; pattern: string; slot_key: string;
             programme: string; starts_on: string;
             students: { id: number; name: string; email: string; joined: string }[] }[];
}
interface Feedback {
  trainers: { trainer_id: number; name: string; email: string; headline: string;
              rating: number | null; rating_count: number }[];
  ratings: { id: number; batch_code: string; class_no: number; student: string;
             class_score: number; trainer_score: number | null; was_cover: boolean;
             comment: string }[];
  mean_class_score: number | null;
}

const fmt = (iso: string) =>
  new Date(iso.length > 10 ? iso : `${iso}T00:00:00`)
    .toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

type Tab = "overview" | "registrations" | "allocation" | "feedback" | "inbox" | "curriculum";

export function Admin() {
  useSeo({ title: "Institute administration" });
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [ov, setOv] = useState<Overview | null>(null);
  const [regs, setRegs] = useState<RegGroup[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [cands, setCands] = useState<Record<number, Candidate[]>>({});
  const [fb, setFb] = useState<Feedback | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [courses, setCourses] = useState<CourseBrief[]>([]);
  const [planCode, setPlanCode] = useState("AI01");
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [coverClass, setCoverClass] = useState<Record<number, number>>({});

  const refresh = useCallback(() => {
    api.get<Overview>("/admin/overview").then(setOv).catch((e) => toast(e.message));
  }, [toast]);

  useEffect(refresh, [refresh]);
  useEffect(() => { api.get<CourseBrief[]>("/courses").then(setCourses).catch(() => {}); }, []);

  useEffect(() => {
    if (tab === "registrations") api.get<RegGroup[]>("/admin/registrations").then(setRegs).catch(() => {});
    if (tab === "allocation") api.get<Batch[]>("/admin/batches").then(setBatches).catch(() => {});
    if (tab === "feedback") api.get<Feedback>("/admin/feedback").then(setFb).catch(() => {});
    if (tab === "inbox") api.get<Lead[]>(`/admin/leads${qs({ limit: 200 })}`).then(setLeads).catch(() => {});
  }, [tab]);

  useEffect(() => {
    if (tab !== "curriculum") return;
    api.get<PlanEntry[]>(`/courses/${planCode}/plan`).then(setPlan).catch(() => {});
  }, [tab, planCode]);

  async function loadCandidates(b: Batch) {
    if (cands[b.id]) return;
    try {
      const rows = await api.get<Candidate[]>(`/admin/batches/${b.id}/candidates`);
      setCands((prev) => ({ ...prev, [b.id]: rows }));
    } catch (e) { toast((e as Error).message); }
  }

  async function allocate(batchId: number, trainerId: number) {
    try {
      const r = await api.post<{ trainer: string }>("/admin/allocate", { batch_id: batchId, trainer_id: trainerId });
      toast(`${r.trainer} allocated`);
      api.get<Batch[]>("/admin/batches").then(setBatches);
      refresh();
    } catch (e) { toast((e as Error).message); }
  }

  async function autoAllocate() {
    try {
      const r = await api.post<{ allocated: number; considered: number }>("/admin/allocate/auto");
      toast(r.allocated ? `Allocated ${r.allocated} of ${r.considered} batches` : "No eligible trainer for the open batches");
      api.get<Batch[]>("/admin/batches").then(setBatches);
      refresh();
    } catch (e) { toast((e as Error).message); }
  }

  async function arrangeCover(b: Batch) {
    const n = coverClass[b.id] ?? Math.min(60, b.classes_held + 1);
    try {
      const r = await api.post<{ trainer: string; class_no: number }>("/admin/cover", { batch_id: b.id, class_no: n });
      toast(`Class ${r.class_no} covered automatically — ${r.trainer}`);
      refresh();
    } catch (e) { toast((e as Error).message); }
  }

  const TABS: [Tab, string][] = [
    ["overview", "Overview"], ["registrations", "Registrations"], ["allocation", "Trainer allocation"],
    ["feedback", "Feedback & ratings"], ["inbox", "Enquiry inbox"], ["curriculum", "Curriculum"],
  ];

  return (
    <section className="section">
      <div className="wrap">
        <span className="kicker" style={{ color: "var(--azure)", fontWeight: 700 }}>Institute administration</span>
        <h2 style={{ marginTop: 12 }}>Desk for {user?.name.split(" ")[0]}.</h2>

        <div className="tabs" style={{ marginTop: 26 }}>
          {TABS.map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === "overview" && ov && (
          <div className="grid g4">
            {([["registrations", "REGISTRATIONS"], ["students", "STUDENTS"], ["trainers", "TRAINERS"],
               ["batches", "BATCHES"], ["staffed", "STAFFED"], ["covers", "COVERS ARRANGED"],
               ["ratings", "RATINGS"], ["new_leads", "NEW ENQUIRIES"]] as const).map(([k, l]) => (
              <div className="card" key={k}>
                <b style={{ display: "block", font: "600 32px var(--sf)" }}>{ov[k]}</b>
                <span className="mono ash">{l}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "registrations" && (
          <div className="stack">
            {regs.map((g) => (
              <div className="card" key={g.course_code}>
                <div className="row between">
                  <div><h3>{g.course_title}</h3><span className="mono ash">{g.course_code}</span></div>
                </div>
                <div className="stack" style={{ marginTop: 16 }}>
                  {g.batches.map((b) => (
                    <div key={b.batch_code} style={{ padding: 14, background: "var(--void)", borderRadius: 12 }}>
                      <div className="mono ash">
                        {b.batch_code} · {b.pattern === "WD" ? "MON–FRI" : "SAT & SUN"} ·{" "}
                        {b.programme === "INTERN" ? "CAREER" : "PROFESSIONAL"} · STARTS {fmt(b.starts_on).toUpperCase()}
                      </div>
                      <div className="stack" style={{ gap: 4, marginTop: 10 }}>
                        {b.students.map((s) => (
                          <div key={s.id} className="mono ash" style={{ fontSize: 12 }}>
                            {s.name} · {s.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!regs.length && <div className="empty"><b>No registrations yet</b>They appear the moment a student joins a batch.</div>}
          </div>
        )}

        {tab === "allocation" && (
          <div className="stack">
            <div className="row between">
              <p className="ash" style={{ fontSize: 14.5, maxWidth: "64ch" }}>
                Batches with a registration or an existing allocation. Trainers are scored on whether
                they teach the track, availability overlap with the batch's own days and timing, start
                date and current load.
              </p>
              <button className="btn primary" onClick={autoAllocate}>Auto-allocate all</button>
            </div>
            {batches.map((b) => (
              <div className="card" key={b.id}>
                <div className="row between">
                  <div><h4>{b.course_title}</h4>
                    <div className="mono ash" style={{ marginTop: 6 }}>
                      {b.code} · {b.pattern === "WD" ? "MON–FRI" : "SAT & SUN"} · {b.seats_taken} ENROLLED
                    </div></div>
                  <span className={`chip ${b.is_staffed ? "good" : "warn"}`}>
                    {b.is_staffed ? "Staffed" : "Awaiting allocation"}</span>
                </div>

                {!cands[b.id]
                  ? <button className="btn sm ghost" style={{ marginTop: 14 }} onClick={() => loadCandidates(b)}>
                      Show candidates</button>
                  : (
                    <div className="stack" style={{ marginTop: 14, gap: 8 }}>
                      {cands[b.id].slice(0, 5).map((c) => (
                        <div className="row between" key={c.trainer_id}
                             style={{ padding: 12, background: "var(--void)", borderRadius: 12 }}>
                          <div>
                            <b>{c.name}</b>{c.expressed_interest && <span className="chip info" style={{ marginLeft: 8 }}>Expressed interest</span>}
                            <div className="mono ash" style={{ marginTop: 5, fontSize: 11.5 }}>
                              {c.reasons.join(" · ").toUpperCase()} · LOAD {c.load}/{c.capacity}
                              {c.rating !== null ? ` · RATED ${c.rating}/5 FROM ${c.rating_count}` : " · NOT YET RATED"}
                            </div>
                          </div>
                          <div className="row" style={{ gap: 10 }}>
                            <span className="mono"><b>{c.score}</b></span>
                            <button className="btn sm primary" disabled={!c.eligible}
                                    onClick={() => allocate(b.id, c.trainer_id)}>Allocate</button>
                          </div>
                        </div>
                      ))}
                      {!cands[b.id].length && <p className="ash">Nobody in the trainer pool matches this batch yet.</p>}
                    </div>
                  )}

                {b.is_staffed && (
                  <div className="row" style={{ marginTop: 14, gap: 10 }}>
                    <span className="mono ash">PRIMARY UNAVAILABLE FOR CLASS</span>
                    <input className="in" style={{ width: 90, minHeight: 40 }} type="number" min={1} max={60}
                           value={coverClass[b.id] ?? Math.min(60, b.classes_held + 1)}
                           onChange={(e) => setCoverClass({ ...coverClass, [b.id]: Number(e.target.value) })} />
                    <button className="btn sm" onClick={() => arrangeCover(b)}>Auto-allocate a replacement</button>
                  </div>
                )}
              </div>
            ))}
            {!batches.length && <div className="empty"><b>Nothing to allocate yet</b>Batches appear here once a student registers.</div>}
          </div>
        )}

        {tab === "feedback" && fb && (
          <div className="stack">
            <div className="card">
              <h4>Trainer ratings</h4>
              <p className="ash" style={{ fontSize: 13.5, marginTop: 8 }}>
                Mean of every student rating, across all batches. Visible to administrators only —
                trainers do not see their own scores or any comment.
              </p>
              <div className="stack" style={{ marginTop: 16, gap: 8 }}>
                {fb.trainers.map((t) => (
                  <div className="row between" key={t.trainer_id}
                       style={{ padding: 12, background: "var(--void)", borderRadius: 12 }}>
                    <div><b>{t.name}</b>
                      <div className="mono ash" style={{ fontSize: 11.5, marginTop: 4 }}>
                        {(t.headline || "No headline").toUpperCase()} · {t.rating_count} RATINGS</div></div>
                    <span className="mono"><b>{t.rating ?? "—"}</b>/5</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h4>Every rating</h4>
              <div className="tablewrap" style={{ marginTop: 14, border: 0 }}>
                <table>
                  <thead><tr><th>Class</th><th>Batch</th><th>Student</th><th>Class</th><th>Trainer</th><th>Comment</th></tr></thead>
                  <tbody>
                    {fb.ratings.map((r) => (
                      <tr key={r.id}>
                        <td className="mono">{String(r.class_no).padStart(2, "0")}</td>
                        <td className="mono ash">{r.batch_code}</td>
                        <td>{r.student}</td>
                        <td className="mono">{r.class_score}/5</td>
                        <td className="mono">{r.trainer_score ?? "—"}/5{r.was_cover && " · COVER"}</td>
                        <td className="ash" style={{ fontSize: 13.5 }}>{r.comment || "—"}</td>
                      </tr>
                    ))}
                    {!fb.ratings.length && <tr><td colSpan={6}><div className="empty" style={{ border: 0 }}>
                      <b>No ratings yet</b>Students rate each class from their own dashboard.</div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "inbox" && (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Kind</th><th>Name</th><th>Contact</th><th>Note</th><th>State</th><th /></tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td><span className="chip info">{l.kind}</span>
                        <div className="mono ash" style={{ marginTop: 4 }}>{fmt(l.created_at)}</div></td>
                    <td><b>{l.name}</b>{l.organisation && <div className="ash">{l.organisation}</div>}</td>
                    <td className="mono ash">{l.email}<br />{l.phone}</td>
                    <td className="ash" style={{ fontSize: 13.5, maxWidth: 320 }}>{l.note || "—"}</td>
                    <td><span className={`chip ${l.state === "new" ? "warn" : "good"}`}>{l.state}</span></td>
                    <td style={{ textAlign: "right" }}>
                      {l.state === "new" && (
                        <button className="btn sm ghost" onClick={async () => {
                          await api.patch(`/admin/leads/${l.id}?state=contacted`);
                          setLeads((p) => p.map((x) => x.id === l.id ? { ...x, state: "contacted" } : x));
                        }}>Mark contacted</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!leads.length && <tr><td colSpan={6}><div className="empty" style={{ border: 0 }}>
                  <b>Inbox is empty</b>Finder leads, counselling requests and enterprise enquiries arrive here.</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "curriculum" && (
          <div className="card">
            <div className="field" style={{ maxWidth: 480 }}>
              <label htmlFor="c-pick">Track</label>
              <select id="c-pick" className="in" value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
                {courses.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.title}</option>)}
              </select>
            </div>
            <div className="plan" style={{ marginTop: 20 }}>
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
        )}
      </div>
    </section>
  );
}
