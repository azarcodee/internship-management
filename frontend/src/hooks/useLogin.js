import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function useLogin() {
  const { login } = useAuth();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (email, password, onSuccess) => {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("http://localhost/internship-management/backend/auth.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login({ id: data.id, name: data.name, role: data.role });
        onSuccess(data.role);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    }
    setLoading(false);
  };

  return { submit, error, loading };
}

