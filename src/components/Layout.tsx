import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../api/auth";
import { ThemeToggle } from "./Theme";

const LINKS = [
  { to: "/finder", label: "Course finder" },
  { to: "/courses", label: "Catalogue" },
  { to: "/schedule", label: "Schedule" },
];

const ROLE_LINK: Record<string, { to: string; label: string }> = {
  student: { to: "/student", label: "My learning" },
  trainer: { to: "/trainer", label: "Trainer" },
  admin: { to: "/admin", label: "Admin" },
};

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // a route change should always close the mobile drawer
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // and the drawer must not leave the page scrollable underneath it
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const roleLink = user ? ROLE_LINK[user.role] : null;

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="wrap bar">
          <Link className="brand" to="/" aria-label="Miller Institute of Technology">
            <span className="brand-name">MILLER</span>
            <span className="brand-sub">Institute of Technology</span>
          </Link>

          <nav className="nav desk" aria-label="Main">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}
                       className={({ isActive }) => (isActive ? "on" : undefined)}>{l.label}</NavLink>
            ))}
            {roleLink && (
              <NavLink to={roleLink.to}
                       className={({ isActive }) => (isActive ? "on" : undefined)}>{roleLink.label}</NavLink>
            )}
          </nav>

          <div className="bar-end">
            <ThemeToggle />
            {user ? (
              <span className="who">
                <span className="av" aria-hidden="true">
                  {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <span className="who-name">{user.name.split(" ")[0]}</span>
                <button className="btn sm ghost" onClick={logout}>Sign out</button>
              </span>
            ) : (
              <Link className="btn sm primary" to="/signin">Sign in</Link>
            )}
            <button className="burger" type="button" aria-expanded={open}
                    aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
              <span /><span /><span />
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-nav" className="nav mob" aria-label="Main">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
            {roleLink && <NavLink to={roleLink.to}>{roleLink.label}</NavLink>}
            {!user && <NavLink to="/signin">Sign in</NavLink>}
          </nav>
        )}
      </header>

      <main id="main"><Outlet /></main>

      <footer className="site">
        <div className="wrap foot">
          <div>
            <span className="brand-name foot-mark">MILLER</span>
            <span className="brand-sub">Institute of Technology</span>
          </div>
          <span className="mono">30 TRACKS · 60 CLASSES · 5 WEEKDAY + 4 WEEKEND TIMINGS</span>
          <span className="mono foot-live">LINKEDIN LEARNING PREMIUM INCLUDED</span>
        </div>
      </footer>
    </>
  );
}
