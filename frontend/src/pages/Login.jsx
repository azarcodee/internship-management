import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin } from "../hooks/useLogin";
import CardFooter from "../components/auth/CardFooter";
import "./Login.css";

export default function Login() {
  const [step,     setStep]     = useState(1);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const { submit, error, loading } = useLogin();
  const navigate = useNavigate();

  const handleEmailNext = async () => {
    setEmailErr("");
    if (!email) { setEmailErr("Veuillez saisir votre email."); return; }
    setChecking(true);
    try {
      const res = await fetch("http://localhost/internship-management/backend/check-email.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) setStep(2);
      else setEmailErr("Aucun compte trouvé avec cet email.");
    } catch {
      setEmailErr("Erreur serveur.");
    }
    setChecking(false);
  };

  const handleLogin = () => {
    submit(email, password, (role) => {
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/staff/dashboard");
    });
  };

  return (
    <div className="login-bg">
      <div className="login-card">

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <h1 className="welcome-title">Bienvenue .</h1>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailNext()}
                  autoFocus
                />
              </div>
              {emailErr && <p className="err">{emailErr}</p>}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="step-content"
            >
              <h1 className="welcome-title">Bienvenue .</h1>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
              </div>
              {error && <p className="err">{error}</p>}
              <Link to="/forgot-password" className="forgot-link">
                Mot de passe oublié ?
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <CardFooter
          onNext={step === 1 ? handleEmailNext : handleLogin}
          loading={checking || loading}
          showBack={step === 2}
          onBack={() => setStep(1)}
        />

      </div>
    </div>
  );
}