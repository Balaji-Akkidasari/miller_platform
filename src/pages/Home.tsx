import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Faq } from "../components/Faq";
import { SITE_FAQS } from "../lib/faqs";
import { useSeo } from "../lib/seo";

interface Slide {
  tone: "azure" | "teal" | "iris" | "amber";
  kicker: string;
  lines: [string, string, string];
  sub: string;
  cta: { label: string; to: string; primary?: boolean }[];
  stats: [string, string, string, string][];
}

const SLIDES: Slide[] = [
  { tone: "azure", kicker: "Miller Institute of Technology",
    lines: ["Real projects.", "Real deadlines.", "Real evidence."],
    sub: "We train to the standard the industry actually works to. Thirty tracks, sixty classes each — and from class thirty-one you deliver on a live project with a brief, a client and a date.",
    cta: [{ label: "Find your track", to: "/finder", primary: true }, { label: "Apply to study", to: "/signin" }],
    stats: [["30", "", "Tracks across AI", "and technology"], ["180", "h", "Contact hours", "on every track"],
            ["25", "", "Days of live", "project delivery"], ["540", "", "Batches open", "for enrolment"]] },
  { tone: "teal", kicker: "Weekend batches",
    lines: ["Six hours Saturday.", "Six hours Sunday.", "Sixty classes."],
    sub: "Built for people already in full-time work. Fifteen weekends, the whole syllabus, not one hour cut — and no leave to book to get it.",
    cta: [{ label: "See weekend batches", to: "/schedule", primary: true }, { label: "Find your track", to: "/finder" }],
    stats: [["15", "", "Weekends from", "start to finish"], ["6", "h", "A sitting, twice", "every weekend"],
            ["180", "h", "Contact hours,", "same as weekdays"], ["4", "", "Weekend timings", "to choose from"]] },
  { tone: "iris", kicker: "Included with every enrolment",
    lines: ["Three months of", "LinkedIn Learning", "Premium, included."],
    sub: "Every student who completes enrolment gets three months of LinkedIn Learning Premium, worth INR 25,000, at no extra cost. It runs alongside your track.",
    cta: [{ label: "Browse the catalogue", to: "/courses", primary: true }, { label: "Find your track", to: "/finder" }],
    stats: [["3", "mo", "Premium access", "from enrolment"], ["25,000", "", "Rupees of value,", "at no extra cost"],
            ["0", "", "Extra charge on", "any programme"], ["30", "", "Tracks it comes", "bundled with"]] },
  { tone: "amber", kicker: "Career programme",
    lines: ["Sixty classes.", "Then six months", "on a live project."],
    sub: "Supervised, with real deliverables and real review cycles. You finish with work an employer can interrogate, not a certificate that records attendance.",
    cta: [{ label: "Compare the programmes", to: "/finder", primary: true }, { label: "See the catalogue", to: "/courses" }],
    stats: [["60", "", "Classes before", "the internship"], ["26", "wks", "Supervised work", "on a live brief"],
            ["12", "", "Modules, each", "assessed"], ["1", "", "Capstone defended", "before a panel"]] },
  { tone: "azure", kicker: "Free career counselling",
    lines: ["Not sure which", "of the thirty", "is yours?"],
    sub: "Thirty minutes, one to one, at no cost. An advisor looks at where you are now, what you actually enjoy and where you want to be in five years — then tells you honestly.",
    cta: [{ label: "Take the course finder", to: "/finder", primary: true }, { label: "See all thirty", to: "/courses" }],
    stats: [["30", "min", "One to one with", "an advisor"], ["0", "", "Charge, and nothing", "to buy after"],
            ["7", "days", "Evenings and", "weekends too"], ["30", "", "Tracks we will be", "honest about"]] },
];

const DWELL_MS = 10_000;

export function Home() {
  const [i, setI] = useState(0);
  const paused = useRef(false);

  useSeo({
    description: "Industry technology training on live projects. Thirty AI and technology tracks, 60 classes of three hours, nine timings including six-hour weekend sittings, optional six-month internship.",
    keywords: ["technology training institute", "AI training", "weekend bootcamp", "live project training", "six month internship"],
    faqs: SITE_FAQS,
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % SLIDES.length);
    }, DWELL_MS);
    return () => clearInterval(t);
  }, []);

  const s = SLIDES[i];
  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);

  return (
    <>
      <section className="hero" data-tone={s.tone}
               onMouseEnter={() => { paused.current = true; }}
               onMouseLeave={() => { paused.current = false; }}
               onFocus={() => { paused.current = true; }}
               onBlur={() => { paused.current = false; }}
               aria-roledescription="carousel" aria-label="What is on at Miller">
        <div className="wrap">
          <span className="kicker">{s.kicker}</span>
          <h1>
            {s.lines.map((line, k) => (
              <span key={line} style={{ display: "block" }}>
                {k === 2 ? <em className="hl">{line}</em> : line}
              </span>
            ))}
          </h1>
          <p className="sub">{s.sub}</p>
          <div className="cta">
            {s.cta.map((c) => (
              <Link key={c.label} className={`btn lg ${c.primary ? "primary" : "ghost"}`} to={c.to}>{c.label}</Link>
            ))}
          </div>
          <div className="stats">
            {s.stats.map(([v, suf, l1, l2]) => (
              <div key={l1}>
                <b>{v}{suf && <i>{suf}</i>}</b>
                <span>{l1}<br />{l2}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hnav">
          <button className="harrow" onClick={() => go(i - 1)} aria-label="Previous slide">&#8249;</button>
          <div className="hdots" role="tablist" aria-label="Choose a slide">
            {SLIDES.map((sl, k) => (
              <button key={sl.kicker} className={`hdot ${k === i ? "on" : ""}`} role="tab"
                      aria-selected={k === i} aria-label={sl.kicker} onClick={() => go(k)} />
            ))}
          </div>
          <button className="harrow" onClick={() => go(i + 1)} aria-label="Next slide">&#8250;</button>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="head">
            <span className="kicker">Why Miller</span>
            <h2>Six reasons this is <em className="hl">not another course</em>.</h2>
            <p className="sub">Most training teaches you about the work. We put you inside it, with people who do it for a living, on the same tools.</p>
          </div>
          <div className="grid g3 tiles">
            {[
              ["Live projects, not lab exercises", "From class thirty-one you join a delivery team working a real brief with real constraints and a date that does not move."],
              ["Taught by practitioners", "Every instructor is a working engineer, architect or consultant, allocated only where their current practice matches the track."],
              ["The industry's own toolchain", "You work in the consoles, repositories and pipelines that production teams use, not a simplified teaching environment."],
              ["Three hours a class, sixty classes", "Deliberately paced so you can hold down a job or a degree alongside it. Nine timings including four weekend windows."],
              ["Assessed the way work is assessed", "A checkpoint at the end of every module, a full review at class thirty, and a capstone defended before a panel."],
              ["You keep what you build", "Repositories, runbooks, architecture notes and your capstone defence — a portfolio an employer can inspect."],
            ].map(([h, p]) => (
              <article className="tile" key={h}><h3>{h}</h3><p>{p}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head">
            <span className="kicker">Common questions</span>
            <h2>Everything students <em className="hl">ask us first</em>.</h2>
            <p className="sub">Every track page carries its own set as well, answered from that syllabus.</p>
          </div>
          <Faq items={SITE_FAQS} />
          <div className="row" style={{ justifyContent: "center", marginTop: 26 }}>
            <Link className="btn primary" to="/finder">Find your track</Link>
            <Link className="btn ghost" to="/courses">See all thirty tracks</Link>
          </div>
        </div>
      </section>
    </>
  );
}
