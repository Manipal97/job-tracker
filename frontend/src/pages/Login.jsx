import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { BACKEND_URL } from "../api";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      await signIn(data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not reach the server.");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in to Job Tracker</h1>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Sign in</button>
        <a className="btn ghost" href={`${BACKEND_URL}/oauth2/authorization/google`}>Continue with Google</a>
        <p className="alt">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
