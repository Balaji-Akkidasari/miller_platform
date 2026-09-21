import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { FinderResult, PathStep } from "../api/types";
import { useToast } from "../components/Toast";
import { useSeo } from "../lib/seo";
import { validEmail, validName, validPhone, DIALS } from "../lib/validate";

type Kind = "one" | "many";
interface Q { id: keyof Answers; kind: Kind; title: string; hint: string; opts: { v: string; b: string; s: string }[] }
interface Answers {
  level: string | null; background: string | null; domains: string[]; subjects: string[];
  motivations: string[]; styles: string[]; goal: string | null; year5: string | null;
}

const QUESTIONS: Q[] = [
  { id: "level", kind: "one", title: "Where are you now?",
    hint: "This sets the entry point. Nothing assumes you have taken another track first.",
    opts: [
      { v: "entry", b: "New to technology", s: "Career changer, graduate, or moving from a non-technical role." },
      { v: "early", b: "Working in IT, 1–3 years", s: "Service desk, junior admin, junior developer or analyst." },
      { v: "mid", b: "Experienced practitioner", s: "Three years or more delivering hands-on technical work." },
      { v: "adv", b: "Senior or lead", s: "You architect, own systems, or lead a technical team." }] },
  { id: "background", kind: "one", title: "What is your situation right now?",
    hint: "This tells us how the programme needs to fit around the rest of your life.",
    opts: [
      { v: "study", b: "Studying full time", s: "At university or college, or about to finish." },
      { v: "nontech", b: "Working, but not in technology", s: "You have a job and want to move across." },
      { v: "intech", b: "Working in technology", s: "Already in the industry, going deeper or sideways." },
      { v: "break", b: "Returning after a break", s: "Caring, health, relocation or redundancy." },
      { v: "selftaught", b: "Self-taught and job hunting", s: "You have built things, but nothing formal to show." }] },
  { id: "domains", kind: "many", title: "Which areas pull at you?",
    hint: "Pick as many as genuinely appeal. Two or three gives the sharpest result.",
    opts: [
      { v: "security", b: "Cyber security", s: "Defending, testing and governing systems" },
      { v: "cloud|infra", b: "Cloud & infrastructure", s: "Networks, servers, cloud estates" },
      { v: "data", b: "Data & analytics", s: "Pipelines, warehouses, dashboards" },
      { v: "ai", b: "AI & machine learning", s: "LLMs, agents, retrieval, applied ML" },
      { v: "software", b: "Software engineering", s: "Web, mobile, APIs and applications" },
      { v: "platform|automation", b: "Platform & DevOps", s: "CI/CD, Kubernetes, reliability" },
      { v: "business", b: "Business, risk & governance", s: "Compliance, audit, strategy" },
      { v: "quality|support", b: "Quality & IT support", s: "Testing, service desk, end-user computing" }] },
  { id: "subjects", kind: "many", title: "Which of these would you read about for the fun of it?",
    hint: "Not what sounds impressive — what you would actually click on at eleven at night.",
    opts: [
      { v: "security", b: "How a breach actually happened", s: "The intrusion, the mistake, the detection" },
      { v: "infra|platform", b: "Why a huge site stayed up — or fell over", s: "Outage post-mortems" },
      { v: "ai|data", b: "How a model learns something nobody programmed", s: "Training, embeddings" },
      { v: "data|business", b: "Turning messy data into a decision", s: "The analysis that changed a mind" },
      { v: "software", b: "The craft of a beautifully built application", s: "Architecture, readability" },
      { v: "automation|platform", b: "Making a painful manual process disappear", s: "Scripts and pipelines" },
      { v: "business", b: "How a company decides what to build next", s: "Strategy and prioritisation" },
      { v: "infra", b: "How data physically crosses the planet", s: "Cables, routing, latency" }] },
  { id: "motivations", kind: "many", title: "Be honest — what is actually driving this?",
    hint: "There is no wrong answer here, and money is a perfectly good one.",
    opts: [
      { v: "earn", b: "Earning more", s: "The pay and demand of a scarce skill" },
      { v: "curious", b: "Wanting to understand how it works", s: "The appeal is the subject itself" },
      { v: "make", b: "The satisfaction of building something", s: "Point at a thing and say you made it" },
      { v: "impact", b: "Doing work that matters", s: "Protecting people, or making something better" },
      { v: "free", b: "Freedom over where and how you work", s: "Remote, contract, or on your own terms" },
      { v: "status", b: "Being the person they come to", s: "Seniority, influence, a seat at the table" }] },
  { id: "styles", kind: "many", title: "What kind of work do you enjoy?",
    hint: "How you like to spend a day matters more than the job title you are aiming at.",
    opts: [
      { v: "build", b: "Building things", s: "Writing, shipping, making it work" },
      { v: "design", b: "Designing systems", s: "Architecture, trade-offs, the whole picture" },
      { v: "operate", b: "Running and operating", s: "Keeping production healthy" },
      { v: "automate", b: "Automating repetitive work", s: "Turning toil into something that runs itself" },
      { v: "analyse", b: "Analysing and finding patterns", s: "Digging through evidence for the answer" },
      { v: "break", b: "Breaking and testing", s: "Finding what fails before someone else does" },
      { v: "advise", b: "Advising and guiding", s: "Shaping decisions, working with people" }] },
  { id: "goal", kind: "one", title: "Twelve months from now — what has to be true?",
    hint: "Be concrete. This decides which track comes first when several fit equally well.",
    opts: [
      { v: "firstjob", b: "I am in my first technology job", s: "Hired into an entry-level technical role." },
      { v: "switch", b: "I have moved into a different specialism", s: "Doing a different kind of work than today." },
      { v: "specialise", b: "I am materially better at what I already do", s: "Trusted with harder problems." },
      { v: "aimove", b: "I am working on AI systems", s: "Building or operating AI actually in production." },
      { v: "lead", b: "I am setting direction, not only delivering", s: "Leading a team or owning a programme." }] },
  { id: "year5", kind: "one", title: "Five years from now — who do you want to be?",
    hint: "The one that changes the order of your path. The first track matters less than whether it points here.",
    opts: [
      { v: "specialist", b: "The deep expert", s: "Principal-level in one domain." },
      { v: "architect", b: "The person who designs the system", s: "You own the trade-offs across teams." },
      { v: "lead", b: "Leading engineers", s: "Your output is other people's output." },
      { v: "consult", b: "Independent", s: "Consulting or contracting on your own terms." },
      { v: "found", b: "Running something of my own", s: "A product, an agency, a business." },
      { v: "research", b: "At the edge of the field", s: "Problems that do not have answers yet." }] },
];

const EMPTY: Answers = { level: null, background: null, domains: [], subjects: [], motivations: [], styles: [], goal: null, year5: null };

export function Finder() {
  useSeo({
    title: "Course finder — which track fits you",
    description: "Eight questions about where you are, what interests you and where you want to be in five years. Ranked recommendations from thirty tracks.",
    keywords: ["course finder", "career quiz", "which technology course", "tech career path"],
  });

  const toast = useToast();
  const [lead, setLead] = useState<{ name: string; email: string; country: string; phone: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", country: "IN", phone: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [out, setOut] = useState<{ results: FinderResult[]; pathway: PathStep[] } | null>(null);
  const [busy, setBusy] = useState(false);

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    const n = validName(form.name), em = validEmail(form.email), ph = validPhone(form.country, form.phone);
    const next: Record<string, string> = {};
    if (!n.ok) next.name = n.msg!;
    if (!em.ok) next.email = em.msg!;
    if (!ph.ok) next.phone = ph.msg!;
    setErrs(next);
    if (Object.keys(next).length) return;
    const payload = { name: n.value!, email: em.value!, country: form.country, phone: ph.value! };
    setLead(payload);
    api.post("/leads", { kind: "finder", name: payload.name, email: payload.email, phone: payload.phone })
      .catch(() => { /* the finder still runs if the lead cannot be stored */ });
  }

  function pick(q: Q, v: string) {
    setA((prev) => {
      if (q.kind === "one") return { ...prev, [q.id]: v } as Answers;
      const list = prev[q.id] as string[];
      const has = list.includes(v);
      return { ...prev, [q.id]: has ? list.filter((x) => x !== v) : [...list, v] } as Answers;
    });
  }

  async function run() {
    setBusy(true);
    try { setOut(await api.post("/finder", a)); }
    catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  }

  if (!lead) {
    return (
      <div className="wrap section" style={{ maxWidth: 620 }}>
        <span className="kicker" style={{ color: "var(--azure)", fontWeight: 700 }}>Before we start</span>
        <h2 style={{ marginTop: 12 }}>First, who are we <em className="hl">building this for</em>?</h2>
        <p className="lede" style={{ marginTop: 12 }}>
          Eight questions follow, about two minutes. We keep your result against these details so an advisor can pick it up where you left off.
        </p>
        <form className="stack" style={{ marginTop: 26 }} onSubmit={submitLead} noValidate>
          <div className="field">
            <label htmlFor="l-name">Full name</label>
            <input id="l-name" className={`in ${errs.name ? "bad" : ""}`} value={form.name}
                   autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errs.name && <span className="err">{errs.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="l-email">Email address</label>
            <input id="l-email" className={`in ${errs.email ? "bad" : ""}`} value={form.email}
                   type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
                   onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errs.email && <span className="err">{errs.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="l-phone">Mobile number</label>
            <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 10 }}>
              <select id="l-country" className="in" value={form.country} aria-label="Country dialling code"
                      onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {DIALS.map((d) => <option key={d.c} value={d.c}>{d.n} {d.d === "+" ? "" : d.d}</option>)}
              </select>
              <input id="l-phone" className={`in ${errs.phone ? "bad" : ""}`} value={form.phone}
                     type="tel" inputMode="tel" autoComplete="tel"
                     placeholder={DIALS.find((d) => d.c === form.country)?.ex}
                     onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            {errs.phone && <span className="err">{errs.phone}</span>}
          </div>
          <button className="btn primary lg" type="submit">Start the eight questions</button>
        </form>
      </div>
    );
  }

  if (out) {
    return (
      <div className="wrap section" style={{ maxWidth: 900 }}>
        <h2>{lead.name.split(" ")[0]}, three tracks fit <em className="hl">what you described</em>.</h2>
        <div className="stack" style={{ marginTop: 26 }}>
          {out.results.slice(0, 3).map((r, i) => (
            <article className="card" key={r.course.code}>
              <div className="row between">
                <div>
                  <span className="mono ash">{i + 1} · {r.course.code}</span>
                  <h3 style={{ marginTop: 8 }}>
                    <Link to={`/courses/${r.course.code}`} style={{ color: "var(--chalk)" }}>{r.course.title}</Link>
                  </h3>
                  <p className="ash" style={{ fontSize: 14.5, marginTop: 8 }}>{r.course.tagline}</p>
                  <div className="pills" style={{ marginTop: 12 }}>
                    {r.why.map((w) => <span className="chip info" key={w.text}>{w.text}</span>)}
                    <span className="chip">{r.matching_batches} matching batches</span>
                  </div>
                </div>
                <div style={{ minWidth: 120 }}>
                  <span className="mono ash">FIT {r.fit}%</span>
                  <Link className="btn sm primary" to={`/courses/${r.course.code}`} style={{ marginTop: 10 }}>View &amp; enrol</Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!!out.pathway.length && (
          <div className="card" style={{ marginTop: 22 }}>
            <span className="kicker" style={{ color: "var(--azure)", fontWeight: 700 }}>Your route</span>
            <h3 style={{ marginTop: 10 }}>One track does not get you there. Three, in this order, might.</h3>
            <div className="stack" style={{ marginTop: 18 }}>
              {out.pathway.map((p, i) => (
                <div key={p.course_code} className="row" style={{ alignItems: "flex-start", gap: 16 }}>
                  <span className="chip info" style={{ minWidth: 28, justifyContent: "center" }}>{i + 1}</span>
                  <div>
                    <span className="mono ash">{p.when.toUpperCase()}</span>
                    <div><Link to={`/courses/${p.course_code}`} style={{ fontWeight: 600, fontSize: 17 }}>{p.course_title}</Link></div>
                    <p className="ash" style={{ fontSize: 14.5, marginTop: 4 }}>{p.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="btn ghost" style={{ marginTop: 22 }}
                onClick={() => { setOut(null); setStep(0); setA(EMPTY); }}>Start again</button>
      </div>
    );
  }

  const q = QUESTIONS[step];
  const chosen = q.kind === "one" ? !!a[q.id] : (a[q.id] as string[]).length > 0;
  const last = step === QUESTIONS.length - 1;

  return (
    <div className="wrap section" style={{ maxWidth: 880 }}>
      <div className="row" style={{ gap: 14, marginBottom: 26 }}>
        <span className="mono ash">STEP {step + 1} OF {QUESTIONS.length}</span>
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--line)", overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: `${(step / QUESTIONS.length) * 100}%`, background: "var(--azure)" }} />
        </span>
      </div>
      <h2>{q.title}</h2>
      <p className="lede" style={{ marginTop: 12 }}>{q.hint}</p>

      <div className="grid g2" style={{ marginTop: 24 }}>
        {q.opts.map((o) => {
          const on = q.kind === "one" ? a[q.id] === o.v : (a[q.id] as string[]).includes(o.v);
          return (
            <button key={o.v} type="button" onClick={() => pick(q, o.v)}
                    className="card" style={{
                      textAlign: "left", cursor: "pointer",
                      borderColor: on ? "var(--azure)" : "var(--line-2)",
                      background: on ? "var(--azure-soft)" : "var(--panel)" }}
                    aria-pressed={on}>
              <b style={{ display: "block", fontSize: 16 }}>{o.b}</b>
              <span className="ash" style={{ fontSize: 13.5, display: "block", marginTop: 4 }}>{o.s}</span>
            </button>
          );
        })}
      </div>

      <div className="row between" style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
        <button className="btn ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Back</button>
        <button className="btn primary" disabled={!chosen || busy}
                onClick={() => (last ? run() : setStep((s) => s + 1))}>
          {busy ? "Working…" : last ? "See my tracks" : "Continue"}
        </button>
      </div>
    </div>
  );
}
