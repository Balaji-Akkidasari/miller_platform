import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../api/auth";
import type { Enrolment, PlanEntry } from "../api/types";
import { useToast } from "../components/Toast";
import { useSeo } from "../lib/seo";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function Student() {
  useSeo({ title: "My learning" });
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<Enrolment[]>([]);
  const [tab, setTab] = useState<"learning" | "plan">("learning");
  const [plan, setPlan] = useState<Record<string, PlanEntry[]>>({});

  const load = useCallback(() => {
    api.get<Enrolment[]>("/me/enrolments").then(setRows).catch((e) => toast(e.message));
  }, [toast]);

  useEffect(load, [load]);

  useEffect(() => {
    if (tab !== "plan") return;
    rows.forEach((e) => {
      const key = e.batch.code;
      if (plan[key]) return;
      api.get<PlanEntry[]>(`/courses/${e.batch.course_code}/plan?batch_id=${e.batch.id}`)
        .then((p) => setPlan((prev) => ({ ...prev, [key]: p }))).catch(() => {});
    });
  }, [tab, rows, plan]);

  async function withdraw(id: number, title: string) {
    if (!confirm(`Withdraw from ${title}?`)) return;
    try { await api.del(`/me/enrolments/${id}`); toast("Withdrawn"); load(); }
    catch (e) { toast((e as Error).message); }
  }

  async function rate(batchId: number, classNo: number) {
    const cls = Number(prompt("Rate the class, 1 to 5")); if (!cls) return;
    const trn = Number(prompt("Rate the trainer, 1 to 5")) || undefined;
    const comment = prompt("Anything the institute should know? (optional)") ?? "";
    try {
      await api.post("/me/ratings", { batch_id: batchId, class_no: classNo,
                                      class_score: cls, trainer_score: trn, comment });
      toast(`Class ${classNo} rated — thank you.`);
    } catch (e) { toast((e as Error).message); }
  }

  return (
    <section className="section">
      <div className="wrap">
        <span className="kicker" style={{ color: "var(--azure)", fontWeight: 700 }}>Student portal</span>
        <h2 style={{ marginTop: 12 }}>{user?.name}</h2>

        <div className="tabs" style={{ marginTop: 26 }}>
          <button className={tab === "learning" ? "on" : ""} onClick={() => setTab("learning")}>My learning</button>
          <button className={tab === "plan" ? "on" : ""} onClick={() => setTab("plan")}>Class plan &amp; ratings</button>
        </div>

        {!rows.length && (
          <div className="empty">
            <b>No enrolments yet</b>
            Find the track that fits, then choose a batch that fits your week.
            <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
              <Link className="btn primary" to="/finder">Take the course finder</Link>
              <Link className="btn ghost" to="/courses">Browse tracks</Link>
            </div>
          </div>
        )}

        {tab === "learning" && rows.map((e) => {
          const b = e.batch;
          const pct = Math.round((b.classes_held / 60) * 100);
          return (
            <div className="card" key={e.id} style={{ marginBottom: 14 }}>
              <div className="row between">
                <div>
                  <span className="mono ash">{b.course_code} · {b.code}</span>
                  <h3 style={{ marginTop: 8 }}>
                    <Link to={`/courses/${b.course_code}`} style={{ color: "var(--chalk)" }}>{b.course_title}</Link>
                  </h3>
                  <div className="mono ash" style={{ marginTop: 8, lineHeight: 1.7 }}>
                    {fmt(b.starts_on).toUpperCase()} → {fmt(b.classes_end_on).toUpperCase()} · {b.mode.toUpperCase()}<br />
                    {b.pattern === "WD" ? "MON–FRI" : "SAT & SUN"} · {b.programme === "INTERN" ? "CAREER" : "PROFESSIONAL"}
                    {b.internship_end_on && ` · INTERNSHIP TO ${fmt(b.internship_end_on).toUpperCase()}`}<br />
                    {b.is_staffed ? "TRAINER CONFIRMED" : "TRAINER BEING ALLOCATED"} · LINKEDIN LEARNING PREMIUM INCLUDED
                  </div>
                </div>
                <span className={`chip ${b.classes_held >= 60 ? "good" : "info"}`}>
                  {b.classes_held >= 60 ? "Complete" : b.classes_held > 0 ? `Class ${b.classes_held} of 60` : `Starts ${fmt(b.starts_on)}`}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--line)", marginTop: 18, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--azure)" }} />
              </div>
              <div className="row between" style={{ marginTop: 12 }}>
                <span className="mono ash">{pct}% OF CLASSES HELD</span>
                <button className="btn sm ghost" onClick={() => withdraw(e.id, b.course_title ?? "this track")}>Withdraw</button>
              </div>
            </div>
          );
        })}

        {tab === "plan" && rows.map((e) => {
          const entries = plan[e.batch.code] ?? [];
          return (
            <div className="card" key={e.id} style={{ marginBottom: 16 }}>
              <h3>{e.batch.course_title}</h3>
              <p className="mono ash" style={{ marginTop: 6 }}>
                {e.batch.code} · {e.batch.classes_held} OF 60 HELD
              </p>
              <div className="plan" style={{ marginTop: 16 }}>
                {entries.map((p) => {
                  const held = p.n <= e.batch.classes_held;
                  return (
                    <details className="pday" key={p.n}>
                      <summary>
                        <span className="dn">{String(p.n).padStart(2, "0")}</span>
                        <span className="dt"><b>{p.title}</b>
                          <span className="dm">{p.on_date ? fmt(p.on_date).toUpperCase() : ""} · {p.module_id}</span></span>
                        {held
                          ? <button className="btn sm" onClick={(ev) => { ev.preventDefault(); rate(e.batch.id, p.n); }}>Rate</button>
                          : <span className="chip">Upcoming</span>}
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
                  );
                })}
                {!entries.length && <p className="ash">Loading the plan…</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
