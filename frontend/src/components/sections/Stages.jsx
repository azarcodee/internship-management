import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  Table2,
  Download,
  Mail,
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
import { genId, STAGE_STATUTS, statutLabel } from "../../data/constants";

const EMPTY_FORM = {
  etudiant_id: "",
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
  const [pdfLoading, setPdfLoading] = useState(null);

  const servicesForEtab = useMemo(
    () =>
      services.filter(
        (s) => s.etablissement_id === Number(form.etablissement_id),
      ),
    [services, form.etablissement_id],
  );

  // Combobox option arrays
  const etudiantOptions = useMemo(
    () =>
      etudiants.map((e) => ({
        value: String(e.id),
        label: `${e.prenom} ${e.nom}`,
        sub: e.specialite,
      })),
    [etudiants],
  );
  const etablissementOptions = useMemo(
    () =>
      etablissements.map((e) => ({
        value: String(e.id),
        label: e.nom,
        sub: e.type ?? undefined,
      })),
    [etablissements],
  );
  const serviceOptions = useMemo(
    () => servicesForEtab.map((s) => ({ value: String(s.id), label: s.nom })),
    [servicesForEtab],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stages.filter((st) => {
      const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
      const etab = etablissements.find((e) => e.id === st.etablissement_id);
      const matchSearch =
        `${etudiant?.prenom ?? ""} ${etudiant?.nom ?? ""} ${etab?.nom ?? ""}`
          .toLowerCase()
          .includes(q);
      const matchStatut = filterStatut === "all" || st.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [stages, etudiants, etablissements, search, filterStatut]);

  function openAdd() {
    const firstEtab = etablissements[0]?.id ?? "";
    const firstService =
      services.find((s) => s.etablissement_id === firstEtab)?.id ?? "";
    setForm({
      ...EMPTY_FORM,
      etudiant_id: etudiants[0]?.id ?? "",
      etablissement_id: firstEtab,
      service_id: firstService,
    });
    setEditId(null);
    setModalOpen(true);
  }
  function openEdit(st) {
    setForm({
      etudiant_id: st.etudiant_id,
      etablissement_id: st.etablissement_id,
      service_id: st.service_id,
      date_debut: st.date_debut,
      date_fin: st.date_fin,
      statut: st.statut,
      observations: st.observations ?? "",
    });
    setEditId(st.id);
    setModalOpen(true);
  }
  async function handleSave() {
    const data = {
      ...form,
      etudiant_id: Number(form.etudiant_id),
      etablissement_id: Number(form.etablissement_id),
      service_id: Number(form.service_id),
      observations: form.observations || null,
    };
    if (editId) {
      const result = await apiFetch(`/stages.php?id=${editId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
      } else {
        setStages((prev) =>
          prev.map((s) => (s.id === editId ? { ...data, id: editId } : s)),
        );
      }
    } else {
      const result = await apiFetch("/stages.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
      } else {
        setStages((prev) => [...prev, { ...data, id: genId() }]);
      }
    }
    setModalOpen(false);
  }
  async function handleDelete() {
    const result = await apiFetch(`/stages.php?id=${deleteId}`, {
      method: "DELETE",
    });
    if (result && !result.error) {
      await reload();
    } else {
      setStages((prev) => prev.filter((s) => s.id !== deleteId));
    }
    setDeleteId(null);
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
  function handleOpenLetter(stage) {
    window.open(`${API_BASE}/lettre_stage.php?stage_id=${stage.id}`, "_blank");
  }

  return (
    <div className="space-y-5">
      {/* ── Search bar — VERY TOP ── */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "#999" }}
        />
        <input
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
          style={{
            background: "#faf9f7",
            border: "1px solid #e0ddd8",
            color: "#1a1a1a",
            outline: "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          placeholder="Rechercher par étudiant ou établissement…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1a1a1a",
            }}
          >
            Stages
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}
          >
            {stages.length} stage(s) enregistré(s)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerateLetters}
            disabled={!!pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
            style={{
              background: "rgba(5,150,105,0.08)",
              color: "#059669",
              border: "1px solid rgba(5,150,105,0.18)",
            }}
            onMouseEnter={(e) => {
              if (!pdfLoading)
                e.currentTarget.style.background = "rgba(5,150,105,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(5,150,105,0.08)";
            }}
            title="Génère une lettre de demande de stage par étudiant (PDF)"
          >
            {pdfLoading === "letters" ? (
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
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
            style={{
              background: "rgba(124,58,237,0.08)",
              color: "#7c3aed",
              border: "1px solid rgba(124,58,237,0.18)",
            }}
            onMouseEnter={(e) => {
              if (!pdfLoading)
                e.currentTarget.style.background = "rgba(124,58,237,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(124,58,237,0.08)";
            }}
            title="Génère un tableau récapitulatif des stages"
          >
            {pdfLoading === "table" ? (
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <Table2 size={15} />
            )}
            Tableau PDF
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{
              background: "#1a1a1a",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1a1a1a";
            }}
          >
            <Plus size={15} /> Ajouter
          </button>
        </div>
      </div>

      {/* Info note */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs bg-white"
        style={{ border: "1px solid #f0ede8", color: "#666" }}
      >
        <Download size={12} style={{ color: "#2563eb" }} />
        <span>
          Les PDFs sont générés à partir des stages{" "}
          <strong style={{ color: "#1a1a1a" }}>actuellement filtrés</strong>. Le
          bouton ✉️ ouvre{" "}
          <strong style={{ color: "#1a1a1a" }}>api/lettre_stage.php</strong> —
          modifiez ce fichier PHP pour personnaliser la lettre.
        </span>
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
      <div
        className="rounded-3xl overflow-hidden bg-white"
        style={{
          border: "1px solid #f0ede8",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f0ede8" }}>
                {[
                  "Étudiant",
                  "Établissement",
                  "Service",
                  "Début",
                  "Fin",
                  "Statut",
                  "Observations",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: "#999",
                      whiteSpace: "nowrap",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm"
                    style={{ color: "#999" }}
                  >
                    Aucun stage trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((st, i) => {
                const etudiant = etudiants.find((e) => e.id === st.etudiant_id);
                const etab = etablissements.find(
                  (e) => e.id === st.etablissement_id,
                );
                const service = services.find((s) => s.id === st.service_id);
                const style = STATUT_STYLE[st.statut] ?? STATUT_STYLE.annule;
                return (
                  <tr
                    key={st.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid #f0ede8" : "none",
                    }}
                  >
                    <td
                      className="px-5 py-3.5 font-semibold whitespace-nowrap"
                      style={{ color: "#1a1a1a" }}
                    >
                      {etudiant ? `${etudiant.prenom} ${etudiant.nom}` : "—"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm"
                      style={{ color: "#666" }}
                    >
                      {etab?.nom ?? "—"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm"
                      style={{ color: "#666" }}
                    >
                      {service?.nom ?? "—"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm whitespace-nowrap"
                      style={{ color: "#666" }}
                    >
                      {st.date_debut}
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm whitespace-nowrap"
                      style={{ color: "#666" }}
                    >
                      {st.date_fin}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {statutLabel(st.statut)}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-xs max-w-[130px] truncate"
                      style={{ color: "#666" }}
                    >
                      {st.observations ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenLetter(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: "rgba(5,150,105,0.08)",
                            color: "#059669",
                            border: "1px solid rgba(5,150,105,0.15)",
                          }}
                          onMouseEnter={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(5,150,105,0.15)";
                          }}
                          onMouseLeave={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(5,150,105,0.08)";
                          }}
                          title="Générer la lettre (api/lettre_stage.php)"
                        >
                          <Mail size={12} />
                        </button>
                        <button
                          onClick={() => openEdit(st)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: "rgba(59,130,246,0.08)",
                            color: "#2563eb",
                            border: "1px solid rgba(59,130,246,0.15)",
                          }}
                          onMouseEnter={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(59,130,246,0.15)";
                          }}
                          onMouseLeave={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(59,130,246,0.08)";
                          }}
                        >
                          <Pencil size={12} /> Modifier
                        </button>
                        <button
                          onClick={() => setDeleteId(st.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: "rgba(192,57,43,0.06)",
                            color: "#c0392b",
                            border: "1px solid rgba(192,57,43,0.12)",
                          }}
                          onMouseEnter={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(192,57,43,0.12)";
                          }}
                          onMouseLeave={(ev) => {
                            ev.currentTarget.style.background =
                              "rgba(192,57,43,0.06)";
                          }}
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

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier le stage" : "Ajouter un stage"}
            </DialogTitle>
            <DialogDescription>
              Associez un étudiant à un service dans un établissement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Étudiant — searchable combobox */}
            <div>
              <Label>Étudiant</Label>
              <Combobox
                options={etudiantOptions}
                value={String(form.etudiant_id)}
                onValueChange={(v) => setField("etudiant_id", v)}
                placeholder="Choisir un étudiant…"
                searchPlaceholder="Taper un nom…"
              />
            </div>

            {/* Établissement — searchable combobox */}
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

            {/* Service — searchable combobox, filtered by établissement */}
            <div>
              <Label>Service</Label>
              <Combobox
                options={serviceOptions}
                value={String(form.service_id)}
                onValueChange={(v) => setField("service_id", v)}
                placeholder={
                  form.etablissement_id
                    ? "Choisir un service…"
                    : "Sélectionner d'abord un établissement"
                }
                searchPlaceholder="Taper le service…"
                disabled={!form.etablissement_id}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_debut">Date de début</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setField("date_debut", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setField("date_fin", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) => setField("statut", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statutLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observations">Observations (optionnel)</Label>
              <Input
                id="observations"
                value={form.observations}
                onChange={(e) => setField("observations", e.target.value)}
                placeholder="Remarques…"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editId ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le stage</DialogTitle>
            <DialogDescription>
              Ce stage sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
