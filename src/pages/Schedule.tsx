import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, qs } from "../api/client";
import type { Batch, Meta } from "../api/types";
import { useSeo } from "../lib/seo";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function Schedule() {
  useSeo({
    title: "Class schedule — every batch and timing",
    description: "Every open batch across the thirty tracks, with start dates, timings and seats. Five weekday timings and four six-hour weekend windows.",
    keywords: ["class schedule", "course batches", "weekend batches", "course start dates"],
  });

  const [meta, setMeta] = useState<Meta | null>(null);
  const [rows, setRows] = useState<Batch[]>([]);
  const [pattern, setPattern] = useState("any");
  const [programme, setProgramme] = useState("any");
  const [slot, setSlot] = useState("any");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get<Meta>("/meta").then(setMeta).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    api.get<Batch[]>(`/batches${qs({ pattern, programme, slot, limit: 300 })}`)
      .then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [pattern, programme, slot]);

  const label = useMemo(() => {
    const m = new Map(meta?.slots.map((s) => [s.key, s.label]));
    return (k: string) => m.get(k) ?? k;
  }, [meta]);

  return (
    <section className="section">
      <div className="wrap">
        <div className="head">
          <span className="kicker">Class schedule</span>
          <h2>Every batch, <em className="hl">every timing</em>.</h2>
          <p className="sub">Three hours a class on weekdays, six hours a sitting at weekends, sixty classes either way.</p>
        </div>

        <div className="stack" style={{ marginBottom: 20 }}>
          <div className="row">
            <div className="seg" role="group" aria-label="Pattern">
              {[["any", "All patterns"], ["WD", "Weekdays"], ["WE", "Weekend"]].map(([v, l]) => (
                <button key={v} className={pattern === v ? "on" : ""} onClick={() => setPattern(v)}>{l}</button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="Programme">
              {[["any", "Both programmes"], ["CORE", "Professional"], ["INTERN", "Career"]].map(([v, l]) => (
                <button key={v} className={programme === v ? "on" : ""} onClick={() => setProgramme(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="pills">
            <button className={`pill ${slot === "any" ? "on" : ""}`} onClick={() => setSlot("any")}>All timings</button>
            {meta?.slots.map((s) => (
              <button key={s.key} className={`pill ${slot === s.key ? "on" : ""}`} onClick={() => setSlot(s.key)}>
                {s.label}{s.weekend ? " · weekend" : ""}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="ash">Loading batches…</p> : (
          <>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr><th>Track</th><th>Batch</th><th>Pattern &amp; timing</th><th>Programme</th>
                      <th>Starts</th><th>Classes end</th><th>Seats</th><th /></tr>
                </thead>
                <tbody>
                  {rows.slice(0, 80).map((b) => {
                    const left = b.seats - b.seats_taken;
                    return (
                      <tr key={b.id}>
                        <td><div style={{ fontWeight: 600 }}>{b.course_title}</div>
                            <div className="mono ash" style={{ marginTop: 4 }}>{b.course_code}</div></td>
                        <td className="mono ash">{b.code}</td>
                        <td>{b.pattern === "WD" ? "Mon–Fri" : "Sat & Sun"}
                            <div className="mono ash" style={{ marginTop: 4 }}>{label(b.slot_key)}</div></td>
                        <td><span className={`chip ${b.programme === "INTERN" ? "info" : ""}`}>
                          {b.programme === "INTERN" ? "Career" : "Professional"}</span></td>
                        <td className="mono">{fmt(b.starts_on)}</td>
                        <td className="mono">{fmt(b.classes_end_on)}</td>
                        <td className="mono">{left > 0 ? `${left} left` : "Full"}</td>
                        <td style={{ textAlign: "right" }}>
                          <Link className={`btn sm ${left > 0 ? "primary" : "ghost"}`} to={`/courses/${b.course_code}`}>
                            {left > 0 ? "View & join" : "View"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mono ash" style={{ marginTop: 14 }}>
              {rows.length > 80 ? `SHOWING 80 OF ${rows.length} BATCHES — NARROW THE FILTERS` : `${rows.length} BATCHES`}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
