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
import { STAGE_STATUTS, statutLabel } from "../../data/constants";

const EMPTY_FORM = {
  groupe_id: "",
  etablissement_id: "",
  service_id: "",
  date_debut: "",
  date_fin: "",
  statut: "en_attente",
  observations: "",
};

const STATUT_STYLE = {
  en_attente: {
    bg: "rgba(251,191,36,0.10)",
    color: "#b8860b",
    border: "rgba(251,191,36,0.25)",
  },
  en_cours: {
    bg: "rgba(59,130,246,0.10)",
    color: "#2563eb",
    border: "rgba(59,130,246,0.25)",
  },
  termine: {
    bg: "rgba(34,197,94,0.10)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  annule: {
    bg: "rgba(192,57,43,0.10)",
    color: "#c0392b",
    border: "rgba(192,57,43,0.25)",
  },
};

export function Stages({
  stages,
  setStages,
  etudiants,
  etablissements,
  services,
  reload,
}) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null); // { message, count }
  const [pdfLoading, setPdfLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [groupes, setGroupes] = useState([]);
  const [formError, setFormError] = useState("");
  const [observationsEditId, setObservationsEditId] = useState(null);
  const [observationsValue, setObservationsValue] = useState("");

  // Load groupes
  useEffect(() => {
    apiFetch("/groupes.php").then((data) => {
      if (data && !data.error) setGroupes(Array.isArray(data) ? data : []);
    });
  }, []);

  // Auto-dismiss message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Services filtered by établissement
  const servicesForEtab = useMemo(
    () =>
      services.filter(
        (s) => s.etablissement_id === Number(form.etablissement_id)
      ),
    [services, form.etablissement_id]
  );

  // Combobox options
  const groupeOptions = useMemo(
    () =>
      groupes.map((g) => ({
        value: String(g.id),
        label: g.nom,
        sub: `${g.nb_etudiants ?? 0} étudiant(s)`,
      })),
    [groupes]
  );

  const etablissementOptions = useMemo(
    () =>
      etablissements.map((e) => ({
        value: String(e.id),
        label: e.nom,
        sub: e.type ?? undefined,
      })),
    [etablissements]
  );

  const serviceOptions = useMemo(
    () => servicesForEtab.map((s) => ({ value: String(s.id), label: s.nom })),
    [servicesForEtab]
  );

  // Group stages by groupe_id for display
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stages.filter((st) => {
      const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
      const etab = etablissements.find((e) => e.id === st.etablissement_id);
      const groupe = groupes.find((g) => g.id === st.groupe_id);
      const matchSearch =
        `${etudiant?.prenom ?? ""} ${etudiant?.nom ?? ""} ${etab?.nom ?? ""} ${groupe?.nom ?? ""}`
          .toLowerCase()
          .includes(q);
      const matchStatut = filterStatut === "all" || st.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [stages, etudiants, etablissements, groupes, search, filterStatut]);

  function validateDates(debut, fin) {
    if (!debut || !fin) return "Veuillez remplir les deux dates.";
    if (fin < debut) return "La date de fin ne peut pas être antérieure à la date de début.";
    if (fin === debut) return "La date de fin ne peut pas être identique à la date de début.";
    return null;
  }

  // ── Open Add Modal ──
  function openAdd() {
    const firstEtab = etablissements[0]?.id ?? "";
    const firstService =
      services.find((s) => s.etablissement_id === firstEtab)?.id ?? "";
    setForm({
      ...EMPTY_FORM,
      groupe_id: "",
      etablissement_id: firstEtab,
      service_id: firstService,
    });
    setEditId(null);
    setFormError("");
    setModalOpen(true);
  }

  // ── Open Edit Modal (for statut/dates — affects whole group) ──
  function openEdit(st) {
    setForm({
      groupe_id: st.groupe_id ?? "",
      etablissement_id: st.etablissement_id,
      service_id: st.service_id,
      date_debut: st.date_debut,
      date_fin: st.date_fin,
      statut: st.statut,
      observations: "",
    });
    setEditId(st.id);
    setFormError("");
    setModalOpen(true);
  }

  // ── Open Observations Editor (personal) ──
  function openObservationsEdit(st) {
    setObservationsEditId(st.id);
    setObservationsValue(st.observations ?? "");
  }

  // ── Save Observations (personal only) ──
  async function handleSaveObservations() {
    if (!observationsEditId) return;
    const result = await apiFetch(`/stages.php?id=${observationsEditId}`, {
      method: "PUT",
      body: JSON.stringify({
        observations_only: true,
        observations: observationsValue || null,
      }),
    });
    if (result && !result.error) {
      setMessage({ type: "success", text: "Observation mise à jour." });
      await reload();
    } else {
      setMessage({ type: "error", text: result?.error ?? "Erreur." });
    }
    setObservationsEditId(null);
  }

  // ── Save (Add or Edit statut/dates — affects whole group) ──
  async function handleSave() {
    setFormError("");

    const dateErr = validateDates(form.date_debut, form.date_fin);
    if (dateErr) {
      setFormError(dateErr);
      return;
    }

    if (!form.etablissement_id || !form.service_id) {
      setFormError("Veuillez sélectionner un établissement et un service.");
      return;
    }

    if (!editId && !form.groupe_id) {
      setFormError("Veuillez sélectionner un groupe.");
      return;
    }

    const data = {
      groupe_id: form.groupe_id ? Number(form.groupe_id) : undefined,
      etablissement_id: Number(form.etablissement_id),
      service_id: Number(form.service_id),
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      statut: form.statut,
      observations: form.observations || null,
    };

    if (editId) {
      // Editing — will update ALL stages in the same group
      const result = await apiFetch(`/stages.php?id=${editId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        setMessage({
          type: "success",
          text: "Stage(s) modifié(s) avec succès (tous les étudiants du groupe).",
        });
        await reload();
        setModalOpen(false);
      } else {
        setMessage({ type: "error", text: result?.error ?? "Erreur." });
      }
    } else {
      // Adding new — creates stages for all students in the group
      const result = await apiFetch("/stages.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        setMessage({
          type: "success",
          text: result.message ?? "Stage(s) créé(s).",
        });
        await reload();
        setModalOpen(false);
      } else {
        setMessage({ type: "error", text: result?.error ?? "Erreur." });
      }
    }
  }

  // ── Open Delete Confirmation ──
  function openDelete(st) {
    const groupe = groupes.find((g) => g.id === st.groupe_id);
    const countInGroup = stages.filter((s) => s.groupe_id === st.groupe_id).length;
    setDeleteId(st.id);
    setDeleteWarning({
      groupeNom: groupe?.nom ?? "ce groupe",
      count: countInGroup,
      message:
        countInGroup > 1
          ? `Cette action supprimera les stages de TOUS les étudiants du groupe "${groupe?.nom ?? "?"}" (${countInGroup} stages). Pour retirer un seul étudiant, supprimez-le d'abord du groupe dans la section "Groupes".`
          : `Cette action supprimera le stage de cet étudiant.`,
    });
  }

  // ── Confirm Delete ──
  async function handleDelete() {
    const result = await apiFetch(`/stages.php?id=${deleteId}`, {
      method: "DELETE",
    });
    if (result && !result.error) {
      setMessage({
        type: "success",
        text: result.message ?? "Stage(s) supprimé(s).",
      });
      await reload();
    } else {
      setMessage({ type: "error", text: result?.error ?? "Erreur." });
    }
    setDeleteId(null);
    setDeleteWarning(null);
  }

  function setField(key, val) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === "etablissement_id") {
        next.service_id =
          services.find((s) => s.etablissement_id === Number(val))?.id ?? "";
      }
      return next;
    });
  }

  // ── PDF ──
  async function handleGenerateLetters() {
    setPdfLoading("letters");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const { generateLettersPDF: gen } = await import("../../lib/pdfUtils");
      gen({
        stages: filtered.length > 0 ? filtered : stages,
        etudiants,
        etablissements,
        services,
      });
    } catch (err) {
      console.error(err);
    }
    setPdfLoading(null);
  }

  async function handleGenerateTable() {
    setPdfLoading("table");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const { generateTablePDF: gen } = await import("../../lib/pdfUtils");
      gen({
        stages: filtered.length > 0 ? filtered : stages,
        etudiants,
        etablissements,
        services,
      });
    } catch (err) {
      console.error(err);
    }
    setPdfLoading(null);
  }

  return (
    <div className="space-y-5">
      {/* ══════ Message Banner ══════ */}
      {message && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium"
          style={{
            background: message.type === "success" ? "#E6FBF3" : "#FFECEC",
            border:
              message.type === "success"
                ? "1px solid rgba(34,197,94,0.3)"
                : "1px solid rgba(192,57,43,0.3)",
            color: message.type === "success" ? "#065F46" : "#991B1B",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ color: "#c0392b", flexShrink: 0 }} />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", opacity: 0.5, cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#999" }} />
        <input
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
          style={{
            background: "#faf9f7",
            border: "1px solid #e0ddd8",
            color: "#1a1a1a",
            outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          placeholder="Rechercher par étudiant, établissement ou groupe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Stages
          </h2>
          <p className="text-sm mt-1" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>
            {stages.length} stage(s) enregistré(s)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerateLetters}
            disabled={!!pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
            style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.18)" }}
          >
            {pdfLoading === "letters" ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <FileText size={15} />
            )}
            Lettres PDF
          </button>
          <button
            onClick={handleGenerateTable}
            disabled={!!pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
            style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.18)" }}
          >
            {pdfLoading === "table" ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Table2 size={15} />
            )}
            Tableau PDF
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{ background: "#1a1a1a", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...STAGE_STATUTS].map((st) => {
          const active = filterStatut === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer"
              style={{
                background: active ? "#1a1a1a" : "#fff",
                color: active ? "#fff" : "#666",
                border: active ? "1px solid #1a1a1a" : "1px solid #e0ddd8",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {st === "all" ? "Tous" : statutLabel(st)}
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="rounded-3xl overflow-hidden bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f0ede8" }}>
                {["Étudiant", "Groupe", "Établissement", "Service", "Début", "Fin", "Statut", "Observations", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#999", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm" style={{ color: "#999" }}>
                    Aucun stage trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((st, i) => {
                const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
                const etab = etablissements.find((e) => e.id === st.etablissement_id);
                const service = services.find((s) => s.id === st.service_id);
                const groupe = groupes.find((g) => g.id === st.groupe_id);
                const style = STATUT_STYLE[st.statut] ?? STATUT_STYLE.annule;
                return (
                  <tr key={st.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ede8" : "none" }}>
                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ color: "#1a1a1a" }}>
                      {etudiant ? `${etudiant.prenom} ${etudiant.nom}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                      {groupe ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                          <Users size={10} className="inline mr-1" />
                          {groupe.nom}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{etab?.nom ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{service?.nom ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: "#666" }}>{st.date_debut}</td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: "#666" }}>{st.date_fin}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                        {statutLabel(st.statut)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs max-w-[130px] truncate" style={{ color: "#666" }}>
                      <button
                        onClick={() => openObservationsEdit(st)}
                        className="text-left cursor-pointer hover:underline"
                        style={{ color: st.observations ? "#2563eb" : "#999", background: "none", border: "none" }}
                        title="Cliquer pour modifier l'observation personnelle"
                      >
                        {st.observations ? st.observations : "—"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.15)" }}
                        >
                          <Pencil size={12} /> Modifier
                        </button>
                        <button
                          onClick={() => openDelete(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "rgba(192,57,43,0.06)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.12)" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════ Observations Edit Dialog (PERSONAL) ══════ */}
      <Dialog open={!!observationsEditId} onOpenChange={() => setObservationsEditId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'observation</DialogTitle>
            <DialogDescription>
              Cette observation est personnelle et ne concerne que cet étudiant.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Label>Observation</Label>
            <Input
              value={observationsValue}
              onChange={(e) => setObservationsValue(e.target.value)}
              placeholder="Remarques personnelles…"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setObservationsEditId(null)}>Annuler</Button>
            <Button onClick={handleSaveObservations}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ Add/Edit Dialog (GROUP level — statut/dates) ══════ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le stage" : "Ajouter un stage"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Les modifications de statut et dates s'appliquent à TOUS les étudiants du même groupe."
                : "Sélectionnez un groupe — un stage sera créé pour chaque étudiant du groupe."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Groupe */}
            <div>
              <Label>Groupe</Label>
              <Combobox
                options={groupeOptions}
                value={String(form.groupe_id)}
                onValueChange={(v) => setField("groupe_id", v)}
                placeholder="Choisir un groupe…"
                searchPlaceholder="Taper le nom du groupe…"
              />
              {form.groupe_id && (
                <p className="mt-1 text-xs" style={{ color: "#7c3aed" }}>
                  <Users size={11} className="inline mr-1" />
                  Un stage sera créé pour chaque étudiant de ce groupe.
                </p>
              )}
            </div>

            {/* Établissement */}
            <div>
              <Label>Établissement</Label>
              <Combobox
                options={etablissementOptions}
                value={String(form.etablissement_id)}
                onValueChange={(v) => setField("etablissement_id", v)}
                placeholder="Choisir un établissement…"
                searchPlaceholder="Taper le nom…"
              />
            </div>

            {/* Service */}
            <div>
              <Label>Service</Label>
              <Combobox
                options={serviceOptions}
                value={String(form.service_id)}
                onValueChange={(v) => setField("service_id", v)}
                placeholder={form.etablissement_id ? "Choisir un service…" : "Sélectionner d'abord un établissement"}
                searchPlaceholder="Taper le service…"
                disabled={!form.etablissement_id}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_debut">Date de début</Label>
                <Input id="date_debut" type="date" value={form.date_debut}
                  onChange={(e) => setField("date_debut", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input id="date_fin" type="date" value={form.date_fin}
                  onChange={(e) => setField("date_fin", e.target.value)} />
              </div>
            </div>

            {/* Statut */}
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={(v) => setField("statut", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>{statutLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form error */}
            {formError && (
              <p className="text-xs font-medium px-3 py-2 rounded-lg"
                style={{ background: "#FFECEC", color: "#c0392b", border: "1px solid rgba(192,57,43,0.25)" }}>
                {formError}
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editId ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ Delete Confirmation Dialog ══════ */}
      <Dialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteWarning(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          {deleteWarning && (
            <div className="mt-2 space-y-3">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#FFF6E6", border: "1px solid rgba(251,191,36,0.3)" }}>
                <AlertTriangle size={18} style={{ color: "#b8860b", flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm" style={{ color: "#92400E", fontFamily: "'DM Sans', sans-serif" }}>
                  {deleteWarning.message}
                </p>
              </div>
              {deleteWarning.count > 1 && (
                <p className="text-xs" style={{ color: "#999" }}>
                  Pour supprimer un seul étudiant, allez dans <strong>Groupes</strong> → modifier le groupe → retirez l'étudiant concerné.
                </p>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteWarning(null); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer {deleteWarning?.count > 1 ? `(${deleteWarning.count} stages)` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
