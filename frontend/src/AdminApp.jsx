import { useState, useEffect } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./components/sections/Dashboard";
import { Etudiants } from "./components/sections/Etudiants";
import { Etablissements } from "./components/sections/Etablissements";
import { Services } from "./components/sections/Services";
import { Stages } from "./components/sections/Stages";
import { Reports } from "./components/sections/Reports";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost/internship-management/backend";

async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    return await res.json();
  } catch {
    return null;
  }
}

export default function AdminApp() {
  const [page, setPage] = useState("dashboard");
  const [etudiants, setEtudiants] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const [services, setServices] = useState([]);
  const [stages, setStages] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function loadData() {
    const [etud, etabs, svcs, stgs] = await Promise.all([
      apiFetch("/etudiants.php"),
      apiFetch("/etablissements.php"),
      apiFetch("/services.php"),
      apiFetch("/stages.php"),
    ]);
    if (etud) setEtudiants(etud);
    if (etabs) setEtablissements(etabs);
    if (svcs) setServices(svcs);
    if (stgs) setStages(stgs);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            etudiants={etudiants}
            etablissements={etablissements}
            services={services}
            stages={stages}
          />
        );
      case "etudiants":
        return (
          <Etudiants
            etudiants={etudiants}
            setEtudiants={setEtudiants}
            reload={loadData}
          />
        );
      case "etablissements":
        return (
          <Etablissements
            etablissements={etablissements}
            setEtablissements={setEtablissements}
            services={services}
            reload={loadData}
          />
        );
      case "services":
        return (
          <Services
            services={services}
            setServices={setServices}
            etablissements={etablissements}
            reload={loadData}
          />
        );
      case "stages":
        return (
          <Stages
            stages={stages}
            setStages={setStages}
            etudiants={etudiants}
            etablissements={etablissements}
            services={services}
            reload={loadData}
          />
        );
      case "reports":
        return (
          <Reports
            etudiants={etudiants}
            etablissements={etablissements}
            services={services}
            stages={stages}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f8f9fb" }}>
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
      />
      <main className="ml-64 flex-1 p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl">{renderPage()}</div>
      </main>
    </div>
  );
}
