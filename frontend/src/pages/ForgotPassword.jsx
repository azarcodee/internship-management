import { useState } from "react";
import CardFooter from "../components/auth/CardFooter";
import "./Login.css";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError("");
    setMessage("");
    if (!email) { setError("Veuillez saisir votre email."); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost/internship-management/backend/forgot-password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setMessage(data.message);
      else setError(data.message);
    } catch {
      setError("Erreur serveur.");
    }
    setLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="step-content">
          <h1 className="welcome-title">Mot de passe oublié ? Pas de soucis !</h1>
          <p className="hint">Veuillez saisir l'email de votre compte.</p>
          <div className="input-wrap">
            <span className="input-icon">✉</span>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              autoFocus
            />
          </div>
          {error && <p className="err">{error}</p>}
          {message && (
            <p style={{
              fontSize: "13px",
              color: "#27ae60",
              marginTop: "12px",
              padding: "10px 14px",
              background: "#f0faf4",
              borderRadius: "8px",
              border: "1px solid #a8dbb8"
            }}>
              {message}
            </p>
          )}
        </div>
        <CardFooter onNext={handle} loading={loading} showBack={true} />
      </div>
    </div>
  );
}