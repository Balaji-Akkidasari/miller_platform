import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="wrap section">
      <div className="empty">
        <b>That page does not exist</b>
        <p>It may have moved, or the link may be wrong.</p>
        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          <Link className="btn primary" to="/">Back to the home page</Link>
          <Link className="btn ghost" to="/courses">Browse the catalogue</Link>
        </div>
      </div>
    </div>
  );
}
