import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CardFooter from "../components/auth/CardFooter";
import "./Login.css";

export default function ResetPassword() {
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [message,   setMessage]   = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get("token");

  const handle = async () => {
    setError("");
    setMessage("");
    if (!password || password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost/internship-management/backend/reset-password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate("/"), 2000);
      } else setError(data.message);
    } catch {
      setError("Erreur serveur.");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="login-bg">
        <div className="login-card access-denied-card">
          <div className="access-denied">
            <div className="denied-icon">✕</div>
            <h1 className="denied-title">Accès refusé</h1>
            <p className="denied-msg">Oups... mauvaise pioche ! </p>
            <button className="denied-btn" onClick={() => navigate("/")}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="step-content">
          <h1 className="welcome-title">Nouveau mot de passe</h1>
           <p className="hint">Veuillez saisir un nouveau mot de passe a votre compte .</p>

          <div className="input-wrap" style={{ marginBottom: "12px" }}>
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-wrap">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
            />
          </div>
          {error   && <p className="err">{error}</p>}
          {message && <p style={{ fontSize: "13px", color: "#27ae60", marginTop: "8px" }}>{message}</p>}
        </div>
        <CardFooter onNext={handle} loading={loading} showBack={false} />
      </div>
    </div>
  );
}