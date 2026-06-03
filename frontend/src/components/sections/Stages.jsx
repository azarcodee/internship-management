import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  Table2,
  Users,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronDown,
  Download,
} from "lucide-react";
import { apiFetch, API_BASE } from "../../lib/api";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Combobox } from "../ui/combobox";
import {
  STAGE_STATUTS,
  statutLabel,
  SPECIALITES,
  ANNEES,
  getCursus,
} from "../../data/constants";

const EMPTY_FORM = {
  groupe_id: "",
  etablissement_id: "",
  service_id: "",
  statut: "en_attente",
  observations: "",
};

const STATUT_STYLE = {
  en_attente: { bg: "rgba(251,191,36,0.10)", color: "#b8860b", border: "rgba(251,191,36,0.25)" },
  en_cours: { bg: "rgba(59,130,246,0.10)", color: "#2563eb", border: "rgba(59,130,246,0.25)" },
  termine: { bg: "rgba(34,197,94,0.10)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  annule: { bg: "rgba(192,57,43,0.10)", color: "#c0392b", border: "rgba(192,57,43,0.25)" },
};

export function Stages({ stages, setStages, etudiants, etablissements, services, reload }) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterSpec, setFilterSpec] = useState("all");
  const [filterAnnee, setFilterAnnee] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [groupes, setGroupes] = useState([]);
  const [formError, setFormError] = useState("");
  const [formWarning, setFormWarning] = useState("");
  const [observationsEditId, setObservationsEditId] = useState(null);
  const [observationsValue, setObservationsValue] = useState("");

  // Tableau PDF state
  const [tableauModalOpen, setTableauModalOpen] = useState(false);
  const [tableauSpec, setTableauSpec] = useState(SPECIALITES[0] ?? "");
  const [tableauAnnee, setTableauAnnee] = useState("1");
  const [tableauDescription, setTableauDescription] = useState("");
  const [tableauDateDebut, setTableauDateDebut] = useState("");
  const [tableauDateFin, setTableauDateFin] = useState("");
  const [tableauGroupeIds, setTableauGroupeIds] = useState([]);
  const [tableauSearch, setTableauSearch] = useState("");
  const [tableauFormError, setTableauFormError] = useState("");

  // Lettre PDF state
  const [lettreModalOpen, setLettreModalOpen] = useState(false);
  const [lettreEtudiantIds, setLettreEtudiantIds] = useState([]);
  const [lettreNumero, setLettreNumero] = useState("");
  const [lettreAnnee, setLettreAnnee] = useState("");
  const [lettreDestinataire, setLettreDestinataire] = useState("");
  const [lettreObjet, setLettreObjet] = useState("A/S stage pratique");
  const [lettrePJ, setLettrePJ] = useState("Liste nominative des étudiants(es)");
  const [lettreAnneePedago, setLettreAnneePedago] = useState("");
  const [lettreHeureDebut, setLettreHeureDebut] = useState("08h00");
  const [lettreHeureFin, setLettreHeureFin] = useState("16h00");
  const [lettreDateDebut, setLettreDateDebut] = useState("");
  const [lettreDateFin, setLettreDateFin] = useState("");
  const [lettreSearch, setLettreSearch] = useState("");
  const [lettreFormError, setLettreFormError] = useState("");

  async function loadGroupesWithStudents() {
    try {
      const listData = await apiFetch("/groupes.php");
      if (listData && !listData.error && Array.isArray(listData)) {
        const groupesWithStudents = await Promise.all(
          listData.map(async (g) => {
            try {
              const detail = await apiFetch(`/groupes.php?id=${g.id}`);
              if (detail && !detail.error) {
                return { ...g, etudiants: detail.etudiants ?? [] };
              }
            } catch (err) {}
            return { ...g, etudiants: [] };
          })
        );
        setGroupes(groupesWithStudents);
      }
    } catch (err) {}
  }

  useEffect(() => { loadGroupesWithStudents(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (formWarning) {
      const timer = setTimeout(() => setFormWarning(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [formWarning]);

  const groupesWithStages = useMemo(() => {
    const ids = new Set();
    stages.forEach((st) => {
      if (st.groupe_id) ids.add(st.groupe_id);
    });
    return ids;
  }, [stages]);

  const availableAnnees = useMemo(() => {
    if (filterSpec === "all") return ANNEES;
    return ANNEES.filter((a) => Number(a) <= getCursus(filterSpec));
  }, [filterSpec]);

  const tableauAvailableAnnees = useMemo(() => {
    return ANNEES.filter((a) => Number(a) <= getCursus(tableauSpec));
  }, [tableauSpec]);

  const tableauMatchingGroupes = useMemo(() => {
    if (!tableauSpec || !tableauAnnee) return [];
    return groupes.filter((g) => {
      if (!g.etudiants || g.etudiants.length === 0) return false;
      return g.etudiants.some(
        (e) => e.specialite === tableauSpec && e.annee === tableauAnnee
      );
    });
  }, [groupes, tableauSpec, tableauAnnee]);

  const filteredTableauGroupes = useMemo(() => {
    if (!tableauSearch.trim()) return tableauMatchingGroupes;
    const q = tableauSearch.toLowerCase();
    return tableauMatchingGroupes.filter((g) => g.nom.toLowerCase().includes(q));
  }, [tableauMatchingGroupes, tableauSearch]);

  const filteredLettreEtudiants = useMemo(() => {
    if (!lettreSearch.trim()) return etudiants;
    const q = lettreSearch.toLowerCase();
    return etudiants.filter(
      (e) =>
        e.nom.toLowerCase().includes(q) ||
        e.prenom.toLowerCase().includes(q) ||
        `${e.prenom} ${e.nom}`.toLowerCase().includes(q)
    );
  }, [etudiants, lettreSearch]);

  useEffect(() => {
    if (filterSpec !== "all" && Number(filterAnnee) > getCursus(filterSpec)) setFilterAnnee("all");
  }, [filterSpec]);

  useEffect(() => {
    if (Number(tableauAnnee) > getCursus(tableauSpec)) setTableauAnnee("1");
  }, [tableauSpec]);

  const servicesForEtab = useMemo(
    () => services.filter((s) => s.etablissement_id === Number(form.etablissement_id)),
    [services, form.etablissement_id]
  );

  const groupeOptions = useMemo(
    () => groupes.map((g) => ({
      value: String(g.id),
      label: g.nom,
      sub: `${g.nb_etudiants ?? 0} étudiant(s)${groupesWithStages.has(g.id) ? " · déjà en stage" : ""}`,
    })),
    [groupes, groupesWithStages]
  );

  const etablissementOptions = useMemo(
    () => etablissements.map((e) => ({ value: String(e.id), label: e.nom, sub: e.type ?? undefined })),
    [etablissements]
  );

  const serviceOptions = useMemo(
    () => servicesForEtab.map((s) => ({ value: String(s.id), label: s.nom })),
    [servicesForEtab]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stages.filter((st) => {
      const e = etudiants.find((x) => x.id === st.etudiant_id);
      const etab = etablissements.find((x) => x.id === st.etablissement_id);
      const g = groupes.find((x) => x.id === st.groupe_id);
      return (
        `${e?.prenom ?? ""} ${e?.nom ?? ""} ${etab?.nom ?? ""} ${g?.nom ?? ""}`.toLowerCase().includes(q) &&
        (filterStatut === "all" || st.statut === filterStatut) &&
        (filterSpec === "all" || e?.specialite === filterSpec) &&
        (filterAnnee === "all" || e?.annee === filterAnnee)
      );
    });
  }, [stages, etudiants, etablissements, groupes, search, filterStatut, filterSpec, filterAnnee]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, etablissement_id: etablissements[0]?.id ?? "", service_id: services.find((s) => s.etablissement_id === etablissements[0]?.id)?.id ?? "" });
    setEditId(null);
    setFormError("");
    setFormWarning("");
    setModalOpen(true);
  }

  function openEdit(st) {
    setForm({
      groupe_id: st.groupe_id ?? "",
      etablissement_id: st.etablissement_id,
      service_id: st.service_id,
      statut: st.statut,
      observations: "",
    });
    setEditId(st.id);
    setFormError("");
    setFormWarning("");
    setModalOpen(true);
  }

  function openObservationsEdit(st) {
    setObservationsEditId(st.id);
    setObservationsValue(st.observations ?? "");
  }

  async function handleSaveObservations() {
    if (!observationsEditId) return;
    const r = await apiFetch(`/stages.php?id=${observationsEditId}`, { method: "PUT", body: JSON.stringify({ observations_only: true, observations: observationsValue || null }) });
    setMessage(r && !r.error ? { type: "success", text: "Observation mise à jour." } : { type: "error", text: r?.error ?? "Erreur." });
    if (r && !r.error) await reload();
    setObservationsEditId(null);
  }

  async function handleSave() {
    setFormError("");
    setFormWarning("");

    if (!form.etablissement_id || !form.service_id) { setFormError("Établissement et service requis."); return; }
    if (!editId && !form.groupe_id) { setFormError("Groupe requis."); return; }

    if (!editId && form.groupe_id && groupesWithStages.has(Number(form.groupe_id))) {
      setFormWarning("Attention : ce groupe a déjà un stage. Ajouter un nouveau stage créera des doublons.");
    }

    let groupeId = form.groupe_id ? Number(form.groupe_id) : undefined;
    if (editId) {
      const originalStage = stages.find((s) => s.id === editId);
      if (originalStage?.groupe_id) groupeId = originalStage.groupe_id;
    }

    const data = { groupe_id: groupeId, etablissement_id: Number(form.etablissement_id), service_id: Number(form.service_id), statut: form.statut || "en_attente", observations: form.observations || null };

    const r = editId
      ? await apiFetch(`/stages.php?id=${editId}`, { method: "PUT", body: JSON.stringify(data) })
      : await apiFetch("/stages.php", { method: "POST", body: JSON.stringify(data) });

    if (r && !r.error) { setMessage({ type: "success", text: r.message ?? (editId ? "Groupe modifié." : "Créé.") }); await reload(); setModalOpen(false); }
    else { setMessage({ type: "error", text: r?.error ?? "Erreur." }); }
  }

  function openDelete(st) {
    const g = groupes.find((x) => x.id === st.groupe_id);
    const n = stages.filter((s) => s.groupe_id === st.groupe_id).length;
    setDeleteId(st.id);
    setDeleteWarning({ groupeNom: g?.nom ?? "?", count: n, message: n > 1 ? `Supprime TOUS les stages du groupe "${g?.nom}" (${n}). Retirez l'étudiant du groupe pour un seul.` : `Supprime le stage.` });
  }

  async function handleDelete() {
    const r = await apiFetch(`/stages.php?id=${deleteId}`, { method: "DELETE" });
    if (r && !r.error) { setMessage({ type: "success", text: r.message }); await reload(); }
    else { setMessage({ type: "error", text: r?.error ?? "Erreur." }); }
    setDeleteId(null); setDeleteWarning(null);
  }

  function setField(k, v) {
    setForm((f) => {
      const n = { ...f, [k]: v };
      if (k === "etablissement_id") n.service_id = services.find((s) => s.etablissement_id === Number(v))?.id ?? "";
      return n;
    });
  }

  // ── Open Lettre PDF Modal ──
  function openLettreModal() {
    setLettreEtudiantIds([]);
    setLettreNumero("");
    setLettreAnnee("");
    setLettreDestinataire("");
    setLettreObjet("A/S stage pratique");
    setLettrePJ("Liste nominative des étudiants(es)");
    setLettreAnneePedago("");
    setLettreHeureDebut("08h00");
    setLettreHeureFin("16h00");
    setLettreDateDebut("");
    setLettreDateFin("");
    setLettreSearch("");
    setLettreFormError("");
    setLettreModalOpen(true);
  }

  function toggleLettreEtudiant(id) {
    setLettreEtudiantIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleGenerateLettrePDF() {
    setLettreFormError("");

    if (lettreEtudiantIds.length === 0) { setLettreFormError("Veuillez sélectionner au moins un étudiant."); return; }
    if (!lettreDateDebut || !lettreDateFin) { setLettreFormError("Les deux dates sont requises."); return; }
    if (lettreDateFin <= lettreDateDebut) { setLettreFormError("La date de fin doit être postérieure à la date de début."); return; }
    if (!lettreDestinataire.trim()) { setLettreFormError("Le destinataire est requis."); return; }

    setPdfLoading("lettre");

    const selectedStudents = etudiants.filter((e) => lettreEtudiantIds.includes(e.id));
    const nomsList = selectedStudents.map((e) => `${e.prenom} ${e.nom}`).join(", ");

    try {
      const { generateLetterPDF: gen } = await import("../../lib/pdfUtils");
      gen({
        numero: lettreNumero || ".....",
        annee: Number(lettreAnnee) || new Date().getFullYear(),
        destinataire: lettreDestinataire.trim(),
        objet: lettreObjet || "A/S stage pratique",
        pj: `${lettrePJ || "Liste nominative"} : ${nomsList}`,
        anneePedagogique: lettreAnneePedago || `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`,
        heureDebut: lettreHeureDebut || "08h00",
        heureFin: lettreHeureFin || "16h00",
        dateDebut: lettreDateDebut,
        dateFin: lettreDateFin,
      });
      setMessage({ type: "success", text: "Lettre PDF générée." });
      setLettreModalOpen(false);
    } catch (e) {
      console.error(e);
      setLettreFormError("Erreur lors de la génération du PDF.");
    }
    setPdfLoading(null);
  }

  // ── Tableau PDF ──
  function openTableauModal() {
    setTableauSpec(SPECIALITES[0] ?? "");
    setTableauAnnee("1");
    setTableauDescription("");
    setTableauDateDebut(new Date().toISOString().split("T")[0]);
    setTableauDateFin("");
    setTableauGroupeIds([]);
    setTableauSearch("");
    setTableauFormError("");
    setTableauModalOpen(true);
  }

  function toggleTableauGroupe(id) {
    setTableauGroupeIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function handleGenerateTableauPDF() {
    setTableauFormError("");

    if (!tableauDateDebut || !tableauDateFin) { setTableauFormError("Les deux dates sont requises."); return; }
    if (tableauDateFin <= tableauDateDebut) { setTableauFormError("Date fin > date début."); return; }
    if (!tableauDescription.trim()) { setTableauFormError("La description (Grade) est requise."); return; }
    if (!tableauGroupeIds.length) { setTableauFormError("Sélectionnez un groupe."); return; }

    setPdfLoading("tableau");
    try {
      for (const gid of tableauGroupeIds) {
        const s = stages.find((x) => x.groupe_id === gid);
        if (s) await apiFetch(`/stages.php?id=${s.id}`, { method: "PUT", body: JSON.stringify({ date_debut: tableauDateDebut, date_fin: tableauDateFin }) });
      }
      await reload();
      const { generateTablePDF: g } = await import("../../lib/pdfUtils");
      g({
        stages: stages.filter((s) => tableauGroupeIds.includes(s.groupe_id)),
        etudiants,
        etablissements,
        services,
        options: {
          description: tableauDescription || null,
          date_debut: tableauDateDebut,
          date_fin: tableauDateFin,
          groupeIds: tableauGroupeIds,
        },
      });
      setMessage({ type: "success", text: "PDF généré." });
      setTableauModalOpen(false);
    } catch (e) {
      setTableauFormError("Erreur lors de la génération du PDF.");
    }
    setPdfLoading(null);
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium"
          style={{ background: message.type === "success" ? "#E6FBF3" : "#FFECEC", border: message.type === "success" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(192,57,43,0.3)", color: message.type === "success" ? "#065F46" : "#991B1B" }}>
          {message.type === "success" ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} /> : <AlertCircle size={18} style={{ color: "#c0392b" }} />}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background: "none", border: "none", opacity: 0.5, cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#999" }} />
        <input className="w-full pl-11 pr-4 py-3 rounded-xl text-sm" style={{ background: "#faf9f7", border: "1px solid #e0ddd8", color: "#1a1a1a", outline: "none" }} placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>Stages</h2>
          <p className="text-sm mt-1" style={{ color: "#999" }}>{stages.length} stage(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={openLettreModal} disabled={!!pdfLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 cursor-pointer" style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.18)" }}><FileText size={15} /> Lettres PDF</button>
          <button onClick={openTableauModal} disabled={!!pdfLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 cursor-pointer" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.18)" }}><Table2 size={15} /> Tableau PDF</button>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: "#1a1a1a", color: "#fff" }}><Plus size={15} /> Ajouter</button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-56">
          <select value={filterSpec} onChange={(e) => setFilterSpec(e.target.value)} className="w-full h-10 px-4 rounded-xl text-sm font-medium appearance-none cursor-pointer" style={{ background: "#faf9f7", color: filterSpec !== "all" ? "#1a1a1a" : "#999", border: filterSpec !== "all" ? "1px solid #a0a09a" : "1px solid #e0ddd8", paddingRight: "2rem", outline: "none" }}>
            <option value="all">Spécialité</option>
            {SPECIALITES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#999" }} />
        </div>
        <div className="relative w-36">
          <select value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)} className="w-full h-10 px-4 rounded-xl text-sm font-medium appearance-none cursor-pointer" style={{ background: "#faf9f7", color: filterAnnee !== "all" ? "#1a1a1a" : "#999", border: filterAnnee !== "all" ? "1px solid #a0a09a" : "1px solid #e0ddd8", paddingRight: "2rem", outline: "none" }}>
            <option value="all">Année</option>
            {availableAnnees.map((a) => <option key={a} value={a}>{a}ème</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#999" }} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", ...STAGE_STATUTS].map((st) => (
          <button key={st} onClick={() => setFilterStatut(st)} className="px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer"
            style={{ background: filterStatut === st ? "#1a1a1a" : "#fff", color: filterStatut === st ? "#fff" : "#666", border: filterStatut === st ? "1px solid #1a1a1a" : "1px solid #e0ddd8" }}>
            {st === "all" ? "Tous" : statutLabel(st)}
          </button>
        ))}
      </div>

      <div className="rounded-3xl overflow-hidden bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f0ede8" }}>
                {["Étudiant", "Groupe", "Établissement", "Service", "Début", "Fin", "Statut", "Obs.", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-12 text-center text-sm" style={{ color: "#999" }}>Aucun stage.</td></tr>}
              {filtered.map((st, i) => {
                const e = etudiants.find((x) => x.id === st.etudiant_id);
                const etab = etablissements.find((x) => x.id === st.etablissement_id);
                const svc = services.find((x) => x.id === st.service_id);
                const g = groupes.find((x) => x.id === st.groupe_id);
                const style = STATUT_STYLE[st.statut] ?? STATUT_STYLE.annule;
                return (
                  <tr key={st.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ede8" : "none" }}>
                    <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ color: "#1a1a1a" }}>{e ? `${e.prenom} ${e.nom}` : "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{g ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}><Users size={10} className="inline mr-1" />{g.nom}</span> : "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#666" }}>{etab?.nom ?? "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#666" }}>{svc?.nom ?? "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#666" }}>{st.date_debut ?? "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#666" }}>{st.date_fin ?? "—"}</td>
                    <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>{statutLabel(st.statut)}</span></td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <button onClick={() => openObservationsEdit(st)} className="text-left hover:underline" style={{ color: st.observations ? "#2563eb" : "#999", background: "none", border: "none" }}>{st.observations || "—"}</button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(st)} className="px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb" }}><Pencil size={12} /></button>
                        <button onClick={() => openDelete(st)} className="px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(192,57,43,0.06)", color: "#c0392b" }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!observationsEditId} onOpenChange={() => setObservationsEditId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Observation</DialogTitle></DialogHeader>
          <div className="mt-2"><Label>Observation</Label><Input value={observationsValue} onChange={(e) => setObservationsValue(e.target.value)} /></div>
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setObservationsEditId(null)}>Annuler</Button><Button onClick={handleSaveObservations}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le stage" : "Ajouter un stage"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Les modifications de statut s'appliquent à TOUS les étudiants du même groupe."
                : "Sélectionnez un groupe — un stage sera créé pour chaque étudiant du groupe."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Groupe visible uniquement en mode ajout */}
            {!editId && (
              <div>
                <Label>Groupe</Label>
                <Combobox options={groupeOptions} value={String(form.groupe_id)} onValueChange={(v) => setField("groupe_id", v)} placeholder="Choisir…" />
                {form.groupe_id && groupesWithStages.has(Number(form.groupe_id)) && (
                  <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#b8860b" }}>
                    <AlertCircle size={11} /> Ce groupe a déjà un stage. Continuer créera des doublons.
                  </p>
                )}
              </div>
            )}

            <div><Label>Établissement</Label><Combobox options={etablissementOptions} value={String(form.etablissement_id)} onValueChange={(v) => setField("etablissement_id", v)} placeholder="Choisir…" /></div>
            <div><Label>Service</Label><Combobox options={serviceOptions} value={String(form.service_id)} onValueChange={(v) => setField("service_id", v)} placeholder="Choisir…" disabled={!form.etablissement_id} /></div>
            <div><Label>Statut</Label><Select value={form.statut} onValueChange={(v) => setField("statut", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAGE_STATUTS.map((s) => <SelectItem key={s} value={s}>{statutLabel(s)}</SelectItem>)}</SelectContent></Select></div>
            {formWarning && <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: "#FFF6E6", color: "#92400E", border: "1px solid rgba(251,191,36,0.3)" }}><AlertTriangle size={12} />{formWarning}</p>}
            {formError && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FFECEC", color: "#c0392b" }}>{formError}</p>}
          </div>
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button><Button onClick={handleSave}>{editId ? "Enregistrer" : "Ajouter"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteWarning(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Confirmer</DialogTitle></DialogHeader>
          {deleteWarning && (
            <div className="mt-2">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "#FFF6E6", border: "1px solid rgba(251,191,36,0.3)" }}>
                <AlertTriangle size={18} style={{ color: "#b8860b", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "#92400E" }}>{deleteWarning.message}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4"><Button variant="outline" onClick={() => { setDeleteId(null); setDeleteWarning(null); }}>Annuler</Button><Button variant="destructive" onClick={handleDelete}><Trash2 size={14} /> Supprimer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lettreModalOpen} onOpenChange={setLettreModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Générer une Lettre de Stage</DialogTitle>
            <DialogDescription>Remplissez les champs pour générer la lettre officielle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Étudiants ({lettreEtudiantIds.length} sélectionné(s)) <span style={{ color: "#c0392b" }}>*</span></Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#999" }} />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                  style={{ background: "#faf9f7", border: "1px solid #e0ddd8", color: "#1a1a1a", outline: "none" }}
                  placeholder="Rechercher un étudiant…"
                  value={lettreSearch}
                  onChange={(e) => setLettreSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl p-1" style={{ border: "1px solid #e0ddd8", background: "#fff" }}>
                {filteredLettreEtudiants.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "#999" }}>Aucun étudiant trouvé.</p>
                ) : (
                  filteredLettreEtudiants.map((etudiant) => {
                    const isSelected = lettreEtudiantIds.includes(etudiant.id);
                    return (
                      <button key={etudiant.id} type="button" onClick={() => toggleLettreEtudiant(etudiant.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all"
                        style={{ background: isSelected ? "rgba(124,58,237,0.08)" : "transparent", cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif" }}>
                        <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0"
                          style={{ borderColor: isSelected ? "#7c3aed" : "#ccc", background: isSelected ? "#7c3aed" : "#fff" }}>
                          {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <div>
                          <span className="font-medium" style={{ color: "#1a1a1a" }}>{etudiant.prenom} {etudiant.nom}</span>
                          <span className="ml-1.5" style={{ color: "#999", fontSize: "11px" }}>{etudiant.specialite} — {etudiant.annee}ème</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° Lettre</Label>
                <Input value={lettreNumero} onChange={(e) => setLettreNumero(e.target.value)} placeholder="....." />
              </div>
              <div>
                <Label>Année</Label>
                <Input value={lettreAnnee} onChange={(e) => setLettreAnnee(e.target.value)} placeholder={new Date().getFullYear().toString()} />
              </div>
            </div>
            <div>
              <Label>Destinataire <span style={{ color: "#c0392b" }}>*</span></Label>
              <Input value={lettreDestinataire} onChange={(e) => setLettreDestinataire(e.target.value)} placeholder="Madame la Directrice du CHU Oran" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objet</Label>
                <Input value={lettreObjet} onChange={(e) => setLettreObjet(e.target.value)} placeholder="A/S stage pratique" />
              </div>
              <div>
                <Label>P/J</Label>
                <Input value={lettrePJ} onChange={(e) => setLettrePJ(e.target.value)} placeholder="Liste nominative des étudiants(es)" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Année Pédagogique</Label>
                <Input value={lettreAnneePedago} onChange={(e) => setLettreAnneePedago(e.target.value)} placeholder={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`} />
              </div>
              <div>
                <Label>Heure début — fin</Label>
                <div className="flex gap-2">
                  <Input value={lettreHeureDebut} onChange={(e) => setLettreHeureDebut(e.target.value)} placeholder="08h00" className="flex-1" />
                  <Input value={lettreHeureFin} onChange={(e) => setLettreHeureFin(e.target.value)} placeholder="16h00" className="flex-1" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date début <span style={{ color: "#c0392b" }}>*</span></Label>
                <Input type="date" value={lettreDateDebut} onChange={(e) => setLettreDateDebut(e.target.value)} />
              </div>
              <div>
                <Label>Date fin <span style={{ color: "#c0392b" }}>*</span></Label>
                <Input type="date" value={lettreDateFin} onChange={(e) => setLettreDateFin(e.target.value)} />
              </div>
            </div>

            {lettreFormError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FFECEC", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)" }}>
                {lettreFormError}
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLettreModalOpen(false)}>Annuler</Button>
            <Button onClick={handleGenerateLettrePDF} disabled={pdfLoading === "lettre"}>
              {pdfLoading === "lettre" ? "Génération..." : <><Download size={14} /> Générer PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tableauModalOpen} onOpenChange={setTableauModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tableau d'Affectation PDF</DialogTitle>
            <DialogDescription>Générez le document officiel d'affectation de stage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Spécialité</Label>
              <Select value={tableauSpec} onValueChange={setTableauSpec}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SPECIALITES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Année</Label>
              <Select value={tableauAnnee} onValueChange={setTableauAnnee}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tableauAvailableAnnees.map((a) => <SelectItem key={a} value={a}>{a}ème</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (Grade) <span style={{ color: "#c0392b" }}>*</span></Label>
              <Input value={tableauDescription} onChange={(e) => setTableauDescription(e.target.value)} placeholder="ex: Infirmiers De Santé Public 3ème Année classe 1 et 2" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début <span style={{ color: "#c0392b" }}>*</span></Label>
                <Input type="date" value={tableauDateDebut} onChange={(e) => setTableauDateDebut(e.target.value)} required />
              </div>
              <div>
                <Label>Date de fin <span style={{ color: "#c0392b" }}>*</span></Label>
                <Input type="date" value={tableauDateFin} onChange={(e) => setTableauDateFin(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Groupes correspondants ({tableauGroupeIds.length} sélectionné(s)) <span style={{ color: "#c0392b" }}>*</span></Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#999" }} />
                <input
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs"
                  style={{ background: "#faf9f7", border: "1px solid #e0ddd8", color: "#1a1a1a", outline: "none" }}
                  placeholder="Rechercher un groupe…"
                  value={tableauSearch}
                  onChange={(e) => setTableauSearch(e.target.value)}
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-xl p-1" style={{ border: "1px solid #e0ddd8", background: "#fff" }}>
                {filteredTableauGroupes.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: "#999" }}>Aucun groupe trouvé.</p>
                ) : (
                  filteredTableauGroupes.map((g) => {
                    const sel = tableauGroupeIds.includes(g.id);
                    return (
                      <button key={g.id} onClick={() => toggleTableauGroupe(g.id)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                        style={{ background: sel ? "rgba(124,58,237,0.08)" : "transparent", cursor: "pointer", border: "none" }}>
                        <div className="w-5 h-5 rounded border flex items-center justify-center" style={{ borderColor: sel ? "#7c3aed" : "#ccc", background: sel ? "#7c3aed" : "#fff" }}>
                          {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <span style={{ color: "#1a1a1a" }}>{g.nom}</span>
                        <span className="ml-2" style={{ color: "#999", fontSize: "11px" }}>{g.nb_etudiants ?? 0} étudiant(s)</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {tableauFormError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#FFECEC", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)" }}>
                {tableauFormError}
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTableauModalOpen(false)}>Annuler</Button>
            <Button onClick={handleGenerateTableauPDF} disabled={pdfLoading === "tableau"}>
              {pdfLoading === "tableau" ? "Génération..." : <><Download size={14} /> Générer PDF</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
