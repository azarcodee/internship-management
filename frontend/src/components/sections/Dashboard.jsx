import { GraduationCap, CheckCircle2, Building2, XCircle, Clock, Stethoscope, TrendingUp } from "lucide-react";
import { statutLabel } from "../../data/constants";

const STATUT_STYLE = {
  en_attente: { bg: "rgba(251,191,36,0.10)", color: "#b8860b", border: "rgba(251,191,36,0.25)" },
  en_cours: { bg: "rgba(59,130,246,0.10)", color: "#2563eb", border: "rgba(59,130,246,0.25)" },
  termine: { bg: "rgba(34,197,94,0.10)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  annule: { bg: "rgba(192,57,43,0.10)", color: "#c0392b", border: "rgba(192,57,43,0.25)" },
};

const STAT_CARDS = [
  { key: "etudiants", icon: GraduationCap, label: "Étudiants", color: "#2563eb", bg: "rgba(59,130,246,0.08)" },
  { key: "en_cours", icon: CheckCircle2, label: "En cours", color: "#16a34a", bg: "rgba(34,197,94,0.08)" },
  { key: "etablissements", icon: Building2, label: "Établissements", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  { key: "services", icon: Stethoscope, label: "Services", color: "#059669", bg: "rgba(5,150,105,0.08)" },
  { key: "en_attente", icon: Clock, label: "En attente", color: "#b8860b", bg: "rgba(251,191,36,0.08)" },
  { key: "annule", icon: XCircle, label: "Annulés", color: "#c0392b", bg: "rgba(192,57,43,0.08)" },
];

function StatCard({ icon: Icon, label, value, sub, accentColor, bgColor }) {
  return (
    <div
      className="flex-1 min-w-[155px] rounded-3xl p-5 bg-white"
      style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: bgColor }}
        >
          <Icon size={22} style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>{value}</p>
          <p className="text-xs mt-1 font-medium" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        </div>
      </div>
      {sub && (
        <p className="mt-3 text-xs font-semibold flex items-center gap-1" style={{ color: accentColor }}>
          <TrendingUp size={11} /> {sub}
        </p>
      )}
    </div>
  );
}

export function Dashboard({ etudiants, etablissements, services, stages }) {
  const en_cours = stages.filter((s) => s.statut === "en_cours").length;
  const termine = stages.filter((s) => s.statut === "termine").length;
  const en_attente = stages.filter((s) => s.statut === "en_attente").length;
  const annule = stages.filter((s) => s.statut === "annule").length;

  const values = {
    etudiants: etudiants.length,
    en_cours,
    etablissements: etablissements.length,
    services: services.length,
    en_attente,
    annule,
  };

  const recentStages = [...stages]
    .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
    .slice(0, 6);

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Tableau de bord
          </h2>
          <p className="text-sm mt-1" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>
            Vue d'ensemble · {today}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-white" style={{ color: "#666", border: "1px solid #e0ddd8" }}>
          {stages.length} stages enregistrés
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap">
        {STAT_CARDS.map(({ key, icon, label, color, bg }) => (
          <StatCard
            key={key}
            icon={icon}
            label={label}
            value={values[key]}
            accentColor={color}
            bgColor={bg}
            sub={key === "en_cours" ? `${Math.round((en_cours / (stages.length || 1)) * 100)}% du total` : key === "annule" && annule > 0 ? `${annule} à traiter` : undefined}
          />
        ))}
      </div>

      {/* Recent stages */}
      <div
        className="rounded-3xl overflow-hidden bg-white"
        style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f0ede8" }}>
          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Stages récents
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f0ede8" }}>
                {["Étudiant", "Établissement", "Service", "Début", "Fin", "Statut"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentStages.map((st, i) => {
                const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
                const etab = etablissements.find((e) => e.id === st.etablissement_id);
                const service = services.find((s) => s.id === st.service_id);
                const style = STATUT_STYLE[st.statut] ?? STATUT_STYLE.annule;
                return (
                  <tr key={st.id}
                    style={{ borderBottom: i < recentStages.length - 1 ? "1px solid #f0ede8" : "none" }}
                  >
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#1a1a1a" }}>
                      {etudiant ? `${etudiant.prenom} ${etudiant.nom}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{etab?.nom ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{service?.nom ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{st.date_debut}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{st.date_fin}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      >
                        {statutLabel(st.statut)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentStages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#999" }}>
                    Aucun stage enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
