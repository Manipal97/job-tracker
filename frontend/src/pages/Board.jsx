import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext.jsx";
import ApplicationDialog from "../components/ApplicationDialog.jsx";
import { STAGES, isFollowUpDue } from "../stages.js";

export default function Board() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [dialog, setDialog] = useState(null); // { app?, status? }
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadStats = () => api.get("/applications/stats").then((r) => setStats(r.data));
  const load = () =>
    Promise.all([api.get("/applications"), api.get("/applications/stats")])
      .then(([a, s]) => { setApps(a.data); setStats(s.data); })
      .catch(() => setError("Could not load your applications."));

  useEffect(() => { load(); }, []);

  const save = async (payload) => {
    setError("");
    try {
      if (dialog.app) await api.put(`/applications/${dialog.app.id}`, payload);
      else await api.post("/applications", payload);
      setDialog(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this application.");
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${dialog.app.company}? This can't be undone.`)) return;
    await api.delete(`/applications/${dialog.app.id}`);
    setDialog(null);
    load();
  };

  const drop = async (stage) => {
    const id = dragId;
    setDragId(null); setOverStage(null);
    const app = apps.find((a) => a.id === id);
    if (!app || app.status === stage) return;
    setApps(apps.map((a) => (a.id === id ? { ...a, status: stage } : a))); // optimistic
    try {
      await api.patch(`/applications/${id}/status`, { status: stage });
      loadStats();
    } catch {
      setError("Could not move that card. Reloaded the board.");
      load();
    }
  };

  const q = query.trim().toLowerCase();
  const visible = q ? apps.filter((a) => `${a.company} ${a.jobTitle} ${a.location || ""}`.toLowerCase().includes(q)) : apps;
  const due = apps.filter(isFollowUpDue);

  return (
    <div className="page">
      <header className="topbar">
        <h1>Job Tracker</h1>
        <input className="search" placeholder="Search company or role" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn" onClick={() => { setError(""); setDialog({}); }}>Add application</button>
        <div className="who">
          <span>{user.name}</span>
          <button className="link" onClick={() => { signOut(); navigate("/login"); }}>Sign out</button>
        </div>
      </header>

      {stats && (
        <dl className="stats">
          <div><dt>Total</dt><dd>{stats.total}</dd></div>
          <div><dt>Applied</dt><dd>{stats.total - stats.byStatus.WISHLIST}</dd></div>
          <div><dt>Interviews</dt><dd>{stats.byStatus.INTERVIEW}</dd></div>
          <div><dt>Offers</dt><dd>{stats.byStatus.OFFER}</dd></div>
          <div><dt>Response rate</dt><dd>{stats.responseRate}%</dd></div>
        </dl>
      )}

      {due.length > 0 && (
        <p className="due-banner">
          Follow up today: {due.map((a, i) => (
            <button key={a.id} className="link" onClick={() => setDialog({ app: a })}>{a.company}{i < due.length - 1 ? "," : ""}</button>
          ))}
        </p>
      )}
      {error && !dialog && <p className="error">{error}</p>}

      <div className="board">
        {STAGES.map((stage) => {
          const cards = visible.filter((a) => a.status === stage.key);
          return (
            <section
              key={stage.key}
              className={`column ${overStage === stage.key ? "over" : ""}`}
              style={{ "--stage": stage.color }}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
              onDragLeave={() => setOverStage(null)}
              onDrop={() => drop(stage.key)}
            >
              <h2>{stage.label} <span>{cards.length}</span></h2>
              {cards.map((a) => (
                <article
                  key={a.id}
                  className={`card ${dragId === a.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  onDragEnd={() => { setDragId(null); setOverStage(null); }}
                  onClick={() => { setError(""); setDialog({ app: a }); }}
                >
                  <strong>{a.company}</strong>
                  <span>{a.jobTitle}</span>
                  {a.location && <small>{a.location}</small>}
                  {a.followUpDate && (
                    <small className={isFollowUpDue(a) ? "badge due" : "badge"}>
                      Follow up {isFollowUpDue(a) ? "now" : a.followUpDate}
                    </small>
                  )}
                </article>
              ))}
              {cards.length === 0 && <p className="hint">{q ? "No matches" : "Drag a card here"}</p>}
              <button className="link add" onClick={() => { setError(""); setDialog({ status: stage.key }); }}>Add to {stage.label.toLowerCase()}</button>
            </section>
          );
        })}
      </div>

      {dialog && (
        <ApplicationDialog
          key={dialog.app?.id ?? "new"}
          initial={dialog.app}
          defaultStatus={dialog.status}
          error={error}
          onSave={save}
          onDelete={remove}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
