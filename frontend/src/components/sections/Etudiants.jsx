import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, GraduationCap, AlertTriangle } from "lucide-react";
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
import { genId, SPECIALITES, ANNEES, getCursus } from "../../data/constants";

const EMPTY_FORM = {
  nom: "",
  prenom: "",
  specialite: "Infirmier",
  annee: "1",
  classe: "",
};

const SPEC_COLORS = {
  Infirmier: { bg: "rgba(59,130,246,0.08)", color: "#2563eb" },
  Kinesitherapie: { bg: "rgba(5,150,105,0.08)", color: "#059669" },
  "Sage-femme": { bg: "rgba(219,39,119,0.08)", color: "#db2777" },
  Laboratoire: { bg: "rgba(184,134,11,0.08)", color: "#b8860b" },
  Radiologie: { bg: "rgba(124,58,237,0.08)", color: "#7c3aed" },
  Pharmacie: { bg: "rgba(6,182,212,0.08)", color: "#0891b2" },
  Anesthesie: { bg: "rgba(234,88,12,0.08)", color: "#ea580c" },
  Nutrition: { bg: "rgba(101,163,13,0.08)", color: "#65a30d" },
};

export function Etudiants({ etudiants, setEtudiants, reload }) {
  const [search, setSearch] = useState("");
  const [filterSpec, setFilterSpec] = useState("Tous");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const specFilters = ["Tous", ...SPECIALITES];

  // Available years depend on selected specialité
  const availableAnnees = useMemo(() => {
    const max = getCursus(form.specialite);
    return ANNEES.filter((a) => Number(a) <= max);
  }, [form.specialite]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return etudiants.filter((e) => {
      const matchSearch = `${e.prenom} ${e.nom} ${e.classe ?? ""}`
        .toLowerCase()
        .includes(q);
      const matchSpec = filterSpec === "Tous" || e.specialite === filterSpec;
      return matchSearch && matchSpec;
    });
  }, [etudiants, search, filterSpec]);

  // ── Check for duplicate student (same nom + prenom) ──
  function checkDuplicate(nom, prenom) {
    if (!nom.trim() || !prenom.trim()) {
      setDuplicateWarning("");
      return false;
    }

    const nomLower = nom.trim().toLowerCase();
    const prenomLower = prenom.trim().toLowerCase();

    const duplicate = etudiants.find((e) => {
      // Exclude current student when editing
      if (editId && e.id === editId) return false;
      return (
        e.nom.toLowerCase() === nomLower &&
        e.prenom.toLowerCase() === prenomLower
      );
    });

    if (duplicate) {
      setDuplicateWarning(
        `Un étudiant nommé "${duplicate.prenom} ${duplicate.nom}" existe déjà (${duplicate.specialite}, ${duplicate.annee}ème année).`
      );
      return true;
    } else {
      setDuplicateWarning("");
      return false;
    }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setDuplicateWarning("");
    setModalOpen(true);
  }

  function openEdit(e) {
    setForm({
      nom: e.nom,
      prenom: e.prenom,
      specialite: e.specialite,
      annee: e.annee,
      classe: e.classe ?? "",
    });
    setEditId(e.id);
    setDuplicateWarning("");
    setModalOpen(true);
  }

  async function handleSave() {
    // Check for empty fields
    if (!form.nom.trim() || !form.prenom.trim()) {
      setDuplicateWarning("Le nom et le prénom sont requis.");
      return;
    }

    // Check for duplicate
    if (checkDuplicate(form.nom, form.prenom)) {
      return; // Don't save — duplicate found
    }

    const data = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      specialite: form.specialite,
      annee: form.annee,
      classe: form.classe || null,
    };

    if (editId) {
      const result = await apiFetch(`/etudiants.php?id=${editId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
        setModalOpen(false);
      } else {
        setDuplicateWarning(result?.error ?? "Erreur lors de la modification.");
      }
    } else {
      const result = await apiFetch("/etudiants.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
        setModalOpen(false);
      } else {
        setDuplicateWarning(result?.error ?? "Erreur lors de l'ajout.");
      }
    }
  }

  async function handleDelete() {
    const result = await apiFetch(`/etudiants.php?id=${deleteId}`, {
      method: "DELETE",
    });
    if (result && !result.error) {
      await reload();
    } else {
      setEtudiants((prev) => prev.filter((e) => e.id !== deleteId));
    }
    setDeleteId(null);
  }

  function setField(key, val) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === "specialite") {
        const max = getCursus(val);
        if (Number(next.annee) > max) next.annee = String(max);
      }
      // Check duplicate when name or prenom changes
      if (key === "nom" || key === "prenom") {
        const nomToCheck = key === "nom" ? val : next.nom;
        const prenomToCheck = key === "prenom" ? val : next.prenom;
        // Use setTimeout to let state update first
        setTimeout(() => checkDuplicate(nomToCheck, prenomToCheck), 0);
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Search bar ── */}
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
          placeholder="Rechercher un étudiant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1a1a1a",
            }}
          >
            Étudiants
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}
          >
            {etudiants.length} étudiant(s) enregistré(s)
          </p>
        </div>
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

      {/* ── Specialty filter pills ── */}
      <div className="flex gap-2 flex-wrap">
        {specFilters.slice(0, 9).map((sp) => (
          <button
            key={sp}
            onClick={() => setFilterSpec(sp)}
            className="px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer"
            style={{
              background: filterSpec === sp ? "#1a1a1a" : "#fff",
              color: filterSpec === sp ? "#fff" : "#666",
              border:
                filterSpec === sp ? "1px solid #1a1a1a" : "1px solid #e0ddd8",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {sp}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-3xl overflow-hidden bg-white"
        style={{
          border: "1px solid #f0ede8",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #f0ede8" }}>
              {["Étudiant", "Spécialité", "Année", "Classe", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: "#999",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: "#999" }}
                >
                  Aucun étudiant trouvé.
                </td>
              </tr>
            )}
            {filtered.map((e, i) => {
              const sc = SPEC_COLORS[e.specialite] ?? {
                bg: "rgba(100,116,139,0.08)",
                color: "#64748b",
              };
              return (
                <tr
                  key={e.id}
                  style={{
                    borderBottom:
                      i < filtered.length - 1 ? "1px solid #f0ede8" : "none",
                  }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(59,130,246,0.08)" }}
                      >
                        <GraduationCap size={14} style={{ color: "#2563eb" }} />
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: "#1a1a1a" }}
                      >
                        {e.prenom} {e.nom}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {e.specialite}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                    {e.annee}ème année
                    {e.specialite === "Sage-femme" && (
                      <span
                        className="ml-1.5 text-xs font-medium px-1.5 py-0.5 rounded-md"
                        style={{
                          background: "rgba(219,39,119,0.08)",
                          color: "#db2777",
                        }}
                        title="Cursus 5 ans"
                      >
                        5 ans
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                    {e.classe ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(e)}
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
                        onClick={() => setDeleteId(e.id)}
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

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier l'étudiant" : "Ajouter un étudiant"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'étudiant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom</Label>
                <Input
                  value={form.prenom}
                  onChange={(e) => setField("prenom", e.target.value)}
                  placeholder="Youcef"
                />
              </div>
              <div>
                <Label>Nom</Label>
                <Input
                  value={form.nom}
                  onChange={(e) => setField("nom", e.target.value)}
                  placeholder="Benali"
                />
              </div>
            </div>

            {/* ══════ DUPLICATE WARNING ══════ */}
            {duplicateWarning && (
              <div
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: "#FFF6E6",
                  border: "1px solid rgba(251,191,36,0.35)",
                  color: "#92400E",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "#b8860b", flexShrink: 0, marginTop: 1 }}
                />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div>
              <Label>Spécialité</Label>
              <Select
                value={form.specialite}
                onValueChange={(v) => setField("specialite", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALITES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                      {s === "Sage-femme"
                        ? " — cursus 5 ans"
                        : " — cursus 3 ans"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs" style={{ color: "#999" }}>
                Cursus :{" "}
                <span
                  className="font-semibold"
                  style={{
                    color:
                      form.specialite === "Sage-femme" ? "#db2777" : "#2563eb",
                  }}
                >
                  {getCursus(form.specialite)} ans
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Année</Label>
                <Select
                  value={form.annee}
                  onValueChange={(v) => setField("annee", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAnnees.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}ème année
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classe</Label>
                <Input
                  value={form.classe}
                  onChange={(e) => setField("classe", e.target.value)}
                  placeholder="Groupe A"
                />
              </div>
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
            <DialogTitle>Supprimer l'étudiant</DialogTitle>
            <DialogDescription>
              Cet étudiant sera définitivement supprimé.
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
