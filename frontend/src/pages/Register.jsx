import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      await signIn(data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server.");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <label>Full name<input value={form.name} onChange={set("name")} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>Password (6+ characters)<input type="password" value={form.password} onChange={set("password")} required minLength={6} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Create account</button>
        <p className="alt">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
