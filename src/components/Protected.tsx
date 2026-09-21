import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../api/auth";
import type { Role } from "../api/types";

export function Protected({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // never redirect while the session is still resolving — a refresh on a
  // protected page would otherwise bounce the user to sign-in every time
  if (loading) return <div className="wrap section"><p className="ash">Loading…</p></div>;
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) {
    return (
      <div className="wrap section">
        <div className="empty">
          <b>Not available for your account</b>
          This area is for {roles.join(" or ")} accounts. You are signed in as {user.role}.
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
