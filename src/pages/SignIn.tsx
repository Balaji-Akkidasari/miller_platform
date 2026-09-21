import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../api/auth";
import type { Role } from "../api/types";
import { useSeo } from "../lib/seo";
import { validEmail, validName } from "../lib/validate";

const HOME: Record<Role, string> = { student: "/student", trainer: "/trainer", admin: "/admin" };

export function SignIn() {
  useSeo({ title: "Sign in", description: "Sign in or register for Miller Institute of Technology." });

  const { login, register } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("student");
  const [f, setF] = useState({ email: "", password: "", name: "", phone: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const em = validEmail(f.email);
    if (!em.ok) next.email = em.msg!;
    if (!f.password) next.password = "Enter your password.";
    if (mode === "register") {
      const n = validName(f.name);
      if (!n.ok) next.name = n.msg!;
      if (f.password.length < 10) next.password = "At least ten characters.";
      else if (/^[A-Za-z]+$/.test(f.password) || /^\d+$/.test(f.password)) {
        next.password = "Mix letters with digits or symbols.";
      }
    }
    setErrs(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = mode === "login"
        ? await login(em.value!, f.password)
        : await register({ email: em.value!, password: f.password, name: f.name.trim(),
                           phone: f.phone || undefined, role });
      nav(location.state?.from ?? HOME[user.role], { replace: true });
    } catch (err) {
      setErrs({ form: (err as Error).message });
    } finally { setBusy(false); }
  }

  return (
    <div className="wrap section" style={{ maxWidth: 520 }}>
      <h2>{mode === "login" ? "Sign in." : "Create your account."}</h2>
      <p className="lede" style={{ marginTop: 12 }}>
        {mode === "login"
          ? "Students, trainers and administrators all sign in here."
          : "Student and trainer accounts can self-register. Administrator accounts are provisioned by the institute."}
      </p>

      <div className="seg" style={{ marginTop: 22 }}>
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Sign in</button>
        <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>Register</button>
      </div>

      {mode === "register" && (
        <div className="seg" style={{ marginTop: 12 }}>
          <button className={role === "student" ? "on" : ""} onClick={() => setRole("student")}>I am a student</button>
          <button className={role === "trainer" ? "on" : ""} onClick={() => setRole("trainer")}>I am a trainer</button>
        </div>
      )}

      <form className="stack" style={{ marginTop: 22 }} onSubmit={submit} noValidate>
        {mode === "register" && (
          <>
            <div className="field">
              <label htmlFor="s-name">Full name</label>
              <input id="s-name" className={`in ${errs.name ? "bad" : ""}`} value={f.name}
                     autoComplete="name" onChange={(e) => setF({ ...f, name: e.target.value })} />
              {errs.name && <span className="err">{errs.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="s-phone">Mobile number <span className="ash">(optional)</span></label>
              <input id="s-phone" className="in" value={f.phone} type="tel" autoComplete="tel"
                     onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="s-email">Email address</label>
          <input id="s-email" className={`in ${errs.email ? "bad" : ""}`} value={f.email}
                 type="email" inputMode="email" autoComplete="email"
                 onChange={(e) => setF({ ...f, email: e.target.value })} />
          {errs.email && <span className="err">{errs.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="s-pw">Password</label>
          <input id="s-pw" className={`in ${errs.password ? "bad" : ""}`} value={f.password}
                 type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                 onChange={(e) => setF({ ...f, password: e.target.value })} />
          {errs.password && <span className="err">{errs.password}</span>}
        </div>
        {errs.form && <div className="err" role="alert">{errs.form}</div>}
        <button className="btn primary lg" type="submit" disabled={busy}>
          {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
