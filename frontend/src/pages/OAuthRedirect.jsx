import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function OAuthRedirect() {
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) { navigate("/login", { replace: true }); return; }
    signIn(token).then(() => navigate("/", { replace: true }));
  }, []);

  return <p className="center-note">Signing you in…</p>;
}
