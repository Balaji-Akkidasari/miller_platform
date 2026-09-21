import { useCallback, useEffect, useState } from "react";

import { api } from "../api/client";
import { useAuth } from "../api/auth";
import type { Batch, CourseBrief, Meta } from "../api/types";
import { useToast } from "../components/Toast";
import { useSeo } from "../lib/seo";

interface Profile {
  headline: string; bio: string; years: number; skills: string[]; teaches: string[];
  availability: string[]; available_from: string | null; modes: string[]; max_batches: number;
}
interface InterestRow { id: number; course_code: string; course_title: string; note: string }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Trainer() {
  useSeo({ title: "Trainer portal" });
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<"profile" | "availability" | "interest" | "allocations">("profile");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [courses, setCourses] = useState<CourseBrief[]>([]);
  const [p, setP] = useState<Profile | null>(null);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [allocs, setAllocs] = useState<{ allocations: Batch[]; covering: { batch_code: string; course_title: string; class_no: number; reason: string }[] } | null>(null);
  const [pick, setPick] = useState("");
  const [note, setNote] = useState("");

  const loadInterests = useCallback(() => {
    api.get<InterestRow[]>("/trainer/interests").then(setInterests).catch(() => {});
  }, []);

  useEffect(() => {
    api.get<Meta>("/meta").then(setMeta).catch(() => {});
    api.get<CourseBrief[]>("/courses").then(setCourses).catch(() => {});
    api.get<Profile>("/trainer/profile").then(setP).catch((e) => toast(e.message));
    loadInterests();
    api.get<typeof allocs>("/trainer/allocations").then(setAllocs).catch(() => {});
  }, [toast, loadInterests]);

  async function save(next: Profile) {
    setP(next);
    try { await api.put("/trainer/profile", next); toast("Saved"); }
    catch (e) { toast((e as Error).message); }
  }

  function toggleSlot(cell: string) {
    if (!p) return;
    const has = p.availability.includes(cell);
    save({ ...p, availability: has ? p.availability.filter((c) => c !== cell) : [...p.availability, cell] });
  }

  async function addInterest() {
    if (!pick) return;
    try {
      await api.post("/trainer/interests", { course_code: pick, note });
      toast("Interest registered"); setNote(""); setPick(""); loadInterests();
    } catch (e) { toast((e as Error).message); }
  }

  if (!p || !meta) return <div className="wrap section"><p className="ash">Loading…</p></div>;

  return (
    <section className="section">
      <div className="wrap">
        <span className="kicker" style={{ color: "var(--amber)", fontWeight: 700 }}>Trainer portal</span>
        <h2 style={{ marginTop: 12 }}>{user?.name}</h2>

        <div className="tabs" style={{ marginTop: 26 }}>
          {([["profile", "Skills"], ["availability", "Availability"],
             ["interest", "Express interest"], ["allocations", "My allocations"]] as const).map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div className="card stack">
              <div className="field"><label htmlFor="t-head">Headline</label>
                <input id="t-head" className="in" value={p.headline}
                       onChange={(e) => setP({ ...p, headline: e.target.value })} /></div>
              <div className="field"><label htmlFor="t-bio">Professional background</label>
                <textarea id="t-bio" className="in" style={{ minHeight: 120 }} value={p.bio}
                          onChange={(e) => setP({ ...p, bio: e.target.value })} /></div>
              <div className="field"><label htmlFor="t-skills">Skills (comma separated)</label>
                <input id="t-skills" className="in" value={p.skills.join(", ")}
                       onChange={(e) => setP({ ...p, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
              <div className="field"><label htmlFor="t-cap">Maximum concurrent batches</label>
                <input id="t-cap" className="in" type="number" min={1} max={8} value={p.max_batches}
                       onChange={(e) => setP({ ...p, max_batches: Number(e.target.value) })} /></div>
              <button className="btn primary" onClick={() => save(p)}>Save profile</button>
            </div>
            <div className="card">
              <h4>Tracks you can teach</h4>
              <p className="ash" style={{ fontSize: 14, marginTop: 8 }}>
                Allocation scores this heaviest. Only tick what you could teach tomorrow.
              </p>
              <div className="pills" style={{ marginTop: 14 }}>
                {courses.map((c) => {
                  const on = p.teaches.includes(c.code);
                  return (
                    <button key={c.code} className={`pill ${on ? "on" : ""}`}
                            onClick={() => save({ ...p, teaches: on ? p.teaches.filter((x) => x !== c.code) : [...p.teaches, c.code] })}>
                      {c.code} {c.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "availability" && (
          <div className="card">
            <h4>Weekly sessions you can teach</h4>
            <p className="ash" style={{ fontSize: 14, marginTop: 8 }}>
              Weekday batches are one three-hour class a day for twelve weeks. Weekend batches are a
              single six-hour sitting on Saturday and Sunday for fifteen weekends. Mark every slot you
              could commit to for a whole batch.
            </p>
            <div style={{ overflowX: "auto", marginTop: 18, paddingBottom: 4 }}>
              <div style={{ display: "grid", gridTemplateColumns: `130px repeat(7, minmax(52px, 1fr))`,
                            gap: 4, minWidth: 520 }}>
                <div />
                {DAYS.map((d) => <div key={d} className="mono ash" style={{ textAlign: "center", fontSize: 11 }}>{d.toUpperCase()}</div>)}
                {meta.slots.map((s) => (
                  <div key={s.key} style={{ display: "contents" }}>
                    <div className="mono ash" style={{ fontSize: 11, alignSelf: "center" }}>
                      {s.name}<br /><span style={{ color: "var(--dim)" }}>{s.short}</span>
                    </div>
                    {DAYS.map((d) => {
                      const weekendDay = d === "Sat" || d === "Sun";
                      const applies = s.weekend ? weekendDay : !weekendDay;
                      const cell = `${d}-${s.key}`;
                      const on = p.availability.includes(cell);
                      return (
                        <button key={cell} disabled={!applies} onClick={() => toggleSlot(cell)}
                                aria-label={`${d} ${s.label}`} aria-pressed={on}
                                style={{ minHeight: 38, borderRadius: 8, cursor: applies ? "pointer" : "not-allowed",
                                         border: `1px solid ${on ? "var(--azure)" : "var(--line)"}`,
                                         background: on ? "var(--azure)" : applies ? "var(--carbon)" : "var(--sunk)",
                                         color: on ? "var(--on-azure)" : "var(--dim)", opacity: applies ? 1 : .4,
                                         font: "500 10px var(--mono)" }}>
                          {applies ? (on ? "FREE" : "—") : ""}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="mono ash" style={{ marginTop: 14 }}>
              {p.availability.length} SLOTS MARKED · WEEKEND ROWS APPLY TO SAT AND SUN ONLY
            </p>
          </div>
        )}

        {tab === "interest" && (
          <div className="grid g2" style={{ alignItems: "start" }}>
            <div className="card">
              <h4>Register interest in a track</h4>
              <p className="ash" style={{ fontSize: 14, marginTop: 8 }}>
                Interest does not allocate you. It puts you in front of the administrator first when a
                batch of that track needs a trainer.
              </p>
              <div className="field" style={{ marginTop: 16 }}>
                <label htmlFor="i-course">Track</label>
                <select id="i-course" className="in" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Choose a track…</option>
                  {courses.filter((c) => !interests.some((i) => i.course_code === c.code))
                          .map((c) => <option key={c.code} value={c.code}>{c.code} — {c.title}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="i-note">Why you (optional)</label>
                <textarea id="i-note" className="in" style={{ minHeight: 90 }} value={note}
                          onChange={(e) => setNote(e.target.value)} />
              </div>
              <button className="btn primary" style={{ marginTop: 14 }} onClick={addInterest} disabled={!pick}>
                Register interest
              </button>
            </div>
            <div className="card">
              <h4>Your registered interest</h4>
              <div className="stack" style={{ marginTop: 14 }}>
                {interests.map((i) => (
                  <div key={i.id} className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                    <div><b>{i.course_title}</b><div className="mono ash">{i.course_code}</div>
                      {i.note && <p className="ash" style={{ fontSize: 13.5, marginTop: 6 }}>{i.note}</p>}</div>
                    <button className="btn sm ghost" onClick={async () => {
                      await api.del(`/trainer/interests/${i.id}`); toast("Withdrawn"); loadInterests();
                    }}>Withdraw</button>
                  </div>
                ))}
                {!interests.length && <p className="ash">Nothing registered yet.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "allocations" && (
          <div className="stack">
            {!!allocs?.covering.length && (
              <div className="card">
                <h4>Classes you are covering</h4>
                <div className="stack" style={{ gap: 6, marginTop: 12 }}>
                  {allocs.covering.map((c) => (
                    <div className="mono ash" key={`${c.batch_code}-${c.class_no}`}>
                      CLASS {String(c.class_no).padStart(2, "0")} · {c.course_title.toUpperCase()} · {c.batch_code}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {allocs?.allocations.map((b) => (
              <div className="card" key={b.id}>
                <div className="row between">
                  <div><h4>{b.course_title}</h4>
                    <div className="mono ash" style={{ marginTop: 6 }}>
                      {b.code} · {b.pattern === "WD" ? "MON–FRI" : "SAT & SUN"} · {b.seats_taken} ENROLLED
                    </div></div>
                  <span className="chip good">{b.classes_held} of 60 held</span>
                </div>
              </div>
            ))}
            {!allocs?.allocations.length && (
              <div className="empty"><b>Not allocated to a batch yet</b>
                Publish your skills and availability, and the institute matches you to batches that fit.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
