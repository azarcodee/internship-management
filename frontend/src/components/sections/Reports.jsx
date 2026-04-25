import { BarChart3, Users, Building2 } from "lucide-react";

export function Reports({ etudiants, etablissements, services, stages }) {
  const total = stages.length;
  const en_cours = stages.filter((s) => s.statut === "en_cours").length;
  const termine = stages.filter((s) => s.statut === "termine").length;
  const en_attente = stages.filter((s) => s.statut === "en_attente").length;
  const annule = stages.filter((s) => s.statut === "annule").length;

  const byEtab = etablissements.map((e) => {
    const stagesE = stages.filter((s) => s.etablissement_id === e.id);
    const serviceCount = services.filter((s) => s.etablissement_id === e.id).length;
    const ec = stagesE.filter((s) => s.statut === "en_cours").length;
    const ter = stagesE.filter((s) => s.statut === "termine").length;
    const ann = stagesE.filter((s) => s.statut === "annule").length;
    const completion = stagesE.length ? Math.round((ter / stagesE.length) * 100) : 0;
    return { ...e, total: stagesE.length, serviceCount, en_cours: ec, termine: ter, annule: ann, completion };
  });

  const specMap = {};
  etudiants.forEach((et) => {
    const count = stages.filter((s) => s.etudiant_id === et.id).length;
    specMap[et.specialite] = (specMap[et.specialite] || 0) + count;
  });
  const bySpec = Object.entries(specMap).sort((a, b) => b[1] - a[1]);

  const summaryCards = [
    { label: "Total stages", value: total, color: "#2563eb", bg: "rgba(59,130,246,0.08)" },
    { label: "En cours", value: en_cours, color: "#16a34a", bg: "rgba(34,197,94,0.08)" },
    { label: "Terminés", value: termine, color: "#059669", bg: "rgba(5,150,105,0.08)" },
    { label: "En attente", value: en_attente, color: "#b8860b", bg: "rgba(251,191,36,0.08)" },
    { label: "Annulés", value: annule, color: "#c0392b", bg: "rgba(192,57,43,0.08)" },
  ];

  const SPEC_COLORS = [
    "#2563eb", "#16a34a", "#db2777", "#b8860b", "#7c3aed", "#0891b2", "#ea580c", "#65a30d",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
          Rapports &amp; Statistiques
        </h2>
        <p className="text-sm mt-1" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>Vue globale des performances de stage</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-3xl p-5 text-center bg-white"
            style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <p className="text-3xl font-semibold leading-none" style={{ fontFamily: "'Cormorant Garamond', serif", color }}>{value}</p>
            <p className="text-xs mt-2" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Performance by établissement */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} style={{ color: "#2563eb" }} />
          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Performance par établissement
          </h3>
        </div>
        <div className="rounded-3xl overflow-hidden bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f0ede8" }}>
                  {["Établissement", "Type", "Wilaya", "Services", "Total", "En cours", "Terminés", "Annulés", "Taux"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byEtab.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: i < byEtab.length - 1 ? "1px solid #f0ede8" : "none" }}>
                    <td className="px-4 py-3.5 font-semibold" style={{ color: "#1a1a1a" }}>{e.nom}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb" }}>{e.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: "#666" }}>{e.wilaya ?? "—"}</td>
                    <td className="px-4 py-3.5 font-bold" style={{ color: "#7c3aed" }}>{e.serviceCount}</td>
                    <td className="px-4 py-3.5 font-bold" style={{ color: "#2563eb" }}>{e.total}</td>
                    <td className="px-4 py-3.5 font-bold" style={{ color: "#16a34a" }}>{e.en_cours}</td>
                    <td className="px-4 py-3.5 font-bold" style={{ color: "#059669" }}>{e.termine}</td>
                    <td className="px-4 py-3.5 font-bold" style={{ color: "#c0392b" }}>{e.annule}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 rounded-full h-2" style={{ background: "#f0ede8" }}>
                          <div className="h-2 rounded-full transition-all duration-500"
                            style={{ width: `${e.completion}%`, background: "linear-gradient(90deg, #2563eb, #0891b2)" }} />
                        </div>
                        <span className="text-xs font-semibold w-9 text-right" style={{ color: "#666" }}>{e.completion}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* By specialité */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} style={{ color: "#2563eb" }} />
          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Stages par spécialité
          </h3>
        </div>
        <div className="rounded-3xl p-6 space-y-4 bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          {bySpec.length === 0 && <p className="text-sm" style={{ color: "#999" }}>Aucune donnée.</p>}
          {bySpec.map(([spec, count], idx) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            const color = SPEC_COLORS[idx % SPEC_COLORS.length];
            return (
              <div key={spec}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{spec}</span>
                  <span className="text-sm font-medium" style={{ color: "#666" }}>{count} stage(s) — {pct}%</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ background: "#f0ede8" }}>
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By établissement (students) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} style={{ color: "#2563eb" }} />
          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Étudiants par établissement
          </h3>
        </div>
        <div className="rounded-3xl p-6 space-y-4 bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          {byEtab.map((e) => {
            const pct = total ? Math.round((e.total / total) * 100) : 0;
            return (
              <div key={e.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{e.nom}</span>
                  <span className="text-sm font-medium" style={{ color: "#666" }}>{e.total} stage(s) — {pct}%</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ background: "#f0ede8" }}>
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #2563eb, #0891b2)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
