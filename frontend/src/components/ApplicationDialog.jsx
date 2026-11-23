import { useState } from "react";
import { STAGES } from "../stages.js";

const EMPTY = {
  company: "", jobTitle: "", location: "", salary: "", jobUrl: "",
  status: "WISHLIST", appliedDate: "", followUpDate: "", notes: "",
};

export default function ApplicationDialog({ initial, defaultStatus, onSave, onDelete, onClose, error }) {
  const [form, setForm] = useState({ ...EMPTY, status: defaultStatus || "WISHLIST", ...initial });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const editing = !!initial?.id;

  const submit = (e) => {
    e.preventDefault();
    const clean = (v) => (v === "" || v == null ? null : v);
    onSave({
      company: form.company, jobTitle: form.jobTitle, status: form.status, notes: clean(form.notes),
      location: clean(form.location), salary: clean(form.salary), jobUrl: clean(form.jobUrl),
      appliedDate: clean(form.appliedDate), followUpDate: clean(form.followUpDate),
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{editing ? "Edit application" : "Add application"}</h3>
        <div className="grid2">
          <label>Company<input value={form.company} onChange={set("company")} required autoFocus /></label>
          <label>Job title<input value={form.jobTitle} onChange={set("jobTitle")} required /></label>
          <label>Location<input value={form.location || ""} onChange={set("location")} /></label>
          <label>Salary<input value={form.salary || ""} onChange={set("salary")} placeholder="e.g. 12 LPA" /></label>
        </div>
        <label>Job link<input type="url" value={form.jobUrl || ""} onChange={set("jobUrl")} placeholder="https://" /></label>
        <div className="grid3">
          <label>Stage
            <select value={form.status} onChange={set("status")}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label>Applied on<input type="date" value={form.appliedDate || ""} onChange={set("appliedDate")} /></label>
          <label>Follow up on<input type="date" value={form.followUpDate || ""} onChange={set("followUpDate")} /></label>
        </div>
        <label>Notes<textarea rows={3} value={form.notes || ""} onChange={set("notes")} /></label>
        {error && <p className="error">{error}</p>}
        <div className="dialog-actions">
          {editing && <button type="button" className="link danger" onClick={onDelete}>Delete</button>}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn">{editing ? "Save changes" : "Add application"}</button>
        </div>
      </form>
    </div>
  );
}
