import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Search,
} from "lucide-react";
import { apiFetch } from "../../lib/api";
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

export function Groupes() {
  const [groupes, setGroupes] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    description: "",
    etudiant_ids: [],
  });
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [groupFormError, setGroupFormError] = useState("");

  // Auto-dismiss message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load ALL groupes with their students on mount
  async function loadAllGroupesWithStudents() {
    setLoading(true);
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
            } catch (err) {
              console.error(`Error loading groupe ${g.id}:`, err);
            }
            return { ...g, etudiants: [] };
          })
        );
        setGroupes(groupesWithStudents);
      }
    } catch (err) {
      console.error("Error loading groupes:", err);
    }
    setLoading(false);
    setAllDataLoaded(true);
  }

  async function loadEtudiants() {
    try {
      const data = await apiFetch("/etudiants.php");
      if (data && !data.error) {
        setEtudiants(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading etudiants:", err);
    }
  }

  // Load everything on mount
  useEffect(() => {
    loadAllGroupesWithStudents();
    loadEtudiants();
  }, []);

  // Reload groupes (after save/delete)
  async function reloadGroupes() {
    setAllDataLoaded(false);
    await loadAllGroupesWithStudents();
  }

  // Build blocked students map
  const blockedMap = useMemo(() => {
    const map = {};
    for (const groupe of groupes) {
      if (groupe.etudiants && groupe.etudiants.length > 0) {
        for (const etudiant of groupe.etudiants) {
          if (!editId || groupe.id !== editId) {
            map[etudiant.id] = groupe.nom;
          }
        }
      }
    }
    return map;
  }, [groupes, editId]);

  // Filtered groupes by search
  const filteredGroupes = useMemo(() => {
    const q = search.toLowerCase();
    return groupes.filter((g) => {
      const studentNames = g.etudiants
        ? g.etudiants.map((e) => `${e.prenom} ${e.nom}`).join(" ")
        : "";
      return `${g.nom} ${g.description ?? ""} ${studentNames}`
        .toLowerCase()
        .includes(q);
    });
  }, [groupes, search]);

  // Toggle expand (supports multiple open)
  function handleToggle(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Open add modal
  function openAdd() {
    setForm({ nom: "", description: "", etudiant_ids: [] });
    setEditId(null);
    setGroupFormError("");
    setModalOpen(true);
  }

  // Open edit modal
  function openEdit(groupe) {
    setEditId(groupe.id);
    const studentIds = groupe.etudiants
      ? groupe.etudiants.map((e) => e.id)
      : [];
    setForm({
      nom: groupe.nom ?? "",
      description: groupe.description ?? "",
      etudiant_ids: studentIds,
    });
    setGroupFormError("");
    setModalOpen(true);
  }

  // Toggle student — only allow same speciality + same year
  function toggleStudent(etudiantId, blockingGroup) {
    if (blockingGroup && !form.etudiant_ids.includes(etudiantId)) {
      return;
    }

    const etudiant = etudiants.find((e) => e.id === etudiantId);
    if (!etudiant) return;

    // If already selected, always allow deselecting
    if (form.etudiant_ids.includes(etudiantId)) {
      setForm((f) => ({
        ...f,
        etudiant_ids: f.etudiant_ids.filter((i) => i !== etudiantId),
      }));
      setGroupFormError("");
      return;
    }

    // If this is the first student being added, allow it
    if (form.etudiant_ids.length === 0) {
      setForm((f) => ({
        ...f,
        etudiant_ids: [...f.etudiant_ids, etudiantId],
      }));
      setGroupFormError("");
      return;
    }

    // Check if the new student matches the existing ones
    const firstSelectedId = form.etudiant_ids[0];
    const firstSelected = etudiants.find((e) => e.id === firstSelectedId);

    if (!firstSelected) return;

    if (
      etudiant.specialite !== firstSelected.specialite ||
      etudiant.annee !== firstSelected.annee
    ) {
      setGroupFormError(
        `Tous les étudiants doivent être de la même spécialité et année. ` +
        `Le groupe contient "${firstSelected.specialite} — ${firstSelected.annee}ème année", ` +
        `mais "${etudiant.prenom} ${etudiant.nom}" est en "${etudiant.specialite} — ${etudiant.annee}ème année".`
      );
      return;
    }

    // All good — add the student
    setForm((f) => ({
      ...f,
      etudiant_ids: [...f.etudiant_ids, etudiantId],
    }));
    setGroupFormError("");
  }

  // Save
  async function handleSave() {
    if (!form.nom.trim()) {
      setMessage({ type: "error", text: "Le nom du groupe est requis." });
      return;
    }
    const payload = {
      nom: form.nom.trim(),
      description: form.description?.trim() || null,
      etudiant_ids: form.etudiant_ids,
    };
    setSaveLoading(true);
    try {
      let result;
      if (editId) {
        result = await apiFetch(`/groupes.php?id=${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        result = await apiFetch("/groupes.php", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      if (result && !result.error) {
        setModalOpen(false);
        setMessage({
          type: "success",
          text: editId
            ? `Groupe "${form.nom}" modifié avec succès.`
            : `Groupe "${form.nom}" créé avec succès.`,
        });
        await reloadGroupes();
      } else {
        setMessage({
          type: "error",
          text: result?.error ?? "Erreur lors de l'enregistrement.",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: "Erreur de connexion au serveur." });
    }
    setSaveLoading(false);
  }

  // Delete
  async function handleDelete() {
    try {
      const result = await apiFetch(`/groupes.php?id=${deleteId}`, {
        method: "DELETE",
      });
      if (result && !result.error) {
        setDeleteId(null);
        setMessage({ type: "success", text: "Groupe supprimé avec succès." });
        await reloadGroupes();
      } else {
        setMessage({
          type: "error",
          text: result?.error ?? "Erreur.",
        });
        setDeleteId(null);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur de connexion." });
      setDeleteId(null);
    }
  }

  // Spec colors
  const specColors = {
    Infirmier: { bg: "rgba(59,130,246,0.08)", color: "#2563eb" },
    Kinesitherapie: { bg: "rgba(5,150,105,0.08)", color: "#059669" },
    "Sage-femme": { bg: "rgba(219,39,119,0.08)", color: "#db2777" },
    Laboratoire: { bg: "rgba(184,134,11,0.08)", color: "#b8860b" },
    Radiologie: { bg: "rgba(124,58,237,0.08)", color: "#7c3aed" },
    "Préparateur en Pharmacie": { bg: "rgba(6,182,212,0.08)", color: "#0891b2" },
  };

  return (
    <div className="space-y-6">
      {/* Message Banner */}
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
            style={{
              background: "none", border: "none", color: "inherit",
              opacity: 0.5, cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search bar */}
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
          placeholder="Rechercher un groupe ou un étudiant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
            Groupes
          </h2>
          <p className="text-sm mt-1" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>
            {groupes.length} groupe(s) enregistré(s)
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{ background: "#1a1a1a", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}
        >
          <Plus size={15} /> Ajouter un groupe
        </button>
      </div>

      {/* Loading / Empty */}
      {loading && !allDataLoaded && (
        <p className="text-sm text-center py-8" style={{ color: "#999" }}>Chargement...</p>
      )}
      {!loading && allDataLoaded && filteredGroupes.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "#999" }}>Aucun groupe trouvé.</p>
      )}

      {/* Groupes list */}
      <div className="space-y-3">
        {filteredGroupes.map((groupe) => {
          const isExpanded = expandedIds.has(groupe.id);
          const students = groupe.etudiants ?? [];

          return (
            <div key={groupe.id} className="rounded-3xl bg-white overflow-hidden"
              style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={() => handleToggle(groupe.id)}
                  className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                  style={{ background: "none", border: "none", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(124,58,237,0.08)" }}>
                    {isExpanded
                      ? <ChevronDown size={18} style={{ color: "#7c3aed" }} />
                      : <ChevronRight size={18} style={{ color: "#7c3aed" }} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: "#1a1a1a" }}>{groupe.nom}</h3>
                    {groupe.description && (
                      <p className="text-xs mt-0.5" style={{ color: "#999" }}>{groupe.description}</p>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                    <Users size={12} className="inline mr-1" />
                    {groupe.nb_etudiants ?? students.length}
                  </span>
                  <button onClick={() => openEdit(groupe)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.15)" }}>
                    <Pencil size={12} /> Modifier
                  </button>
                  <button onClick={() => setDeleteId(groupe.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: "rgba(192,57,43,0.06)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.12)" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-5" style={{ borderTop: "1px solid #f0ede8" }}>
                  {students.length === 0 ? (
                    <p className="text-sm py-4 text-center" style={{ color: "#999" }}>
                      Aucun étudiant dans ce groupe.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
                      {students.map((etudiant) => {
                        const sc = specColors[etudiant.specialite] ?? { bg: "rgba(100,116,139,0.08)", color: "#64748b" };
                        return (
                          <div key={etudiant.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{ background: "#faf9f7" }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: "rgba(59,130,246,0.08)" }}>
                              <GraduationCap size={13} style={{ color: "#2563eb" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "#1a1a1a" }}>
                                {etudiant.prenom} {etudiant.nom}
                              </p>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: sc.bg, color: sc.color, fontSize: "10px" }}>
                                {etudiant.specialite} — {etudiant.annee}ème année
                                {etudiant.classe && ` · ${etudiant.classe}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le groupe" : "Ajouter un groupe"}</DialogTitle>
            <DialogDescription>
              Les étudiants doivent avoir la même spécialité et année. Les étudiants incompatibles sont grisés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nom du groupe</Label>
              <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                placeholder="Groupe A" />
            </div>
            <div>
              <Label>Description (optionnelle)</Label>
              <Input value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Stage CHU Oran..." />
            </div>

            {/* Student selection */}
            <div>
              <Label>
                Étudiants ({form.etudiant_ids.length} sélectionné(s))
                {form.etudiant_ids.length > 0 && (
                  <span style={{ color: "#7c3aed", fontWeight: 400 }}>
                    {" "}— {etudiants.find((e) => e.id === form.etudiant_ids[0])?.specialite}{" "}
                    {etudiants.find((e) => e.id === form.etudiant_ids[0])?.annee}ème année
                  </span>
                )}
              </Label>

              {/* Group form error */}
              {groupFormError && (
                <div
                  className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-2"
                  style={{
                    background: "#FFF6E6",
                    border: "1px solid rgba(251,191,36,0.35)",
                    color: "#92400E",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <AlertCircle
                    size={14}
                    style={{ color: "#b8860b", flexShrink: 0, marginTop: 1 }}
                  />
                  <span>{groupFormError}</span>
                </div>
              )}

              <div
                className="max-h-56 overflow-y-auto rounded-xl p-1"
                style={{ border: "1px solid #e0ddd8", background: "#fff" }}
              >
                {etudiants.map((etudiant) => {
                  const isSelected = form.etudiant_ids.includes(etudiant.id);
                  const blockingGroup = blockedMap[etudiant.id];
                  const isBlocked = !!blockingGroup && !isSelected;

                  // Determine if this student can be added (same spec+year as current selection)
                  const firstSelectedId = form.etudiant_ids[0];
                  const firstSelected = firstSelectedId
                    ? etudiants.find((e) => e.id === firstSelectedId)
                    : null;
                  const isWrongSpecYear =
                    form.etudiant_ids.length > 0 &&
                    !isSelected &&
                    firstSelected &&
                    (etudiant.specialite !== firstSelected.specialite ||
                      etudiant.annee !== firstSelected.annee);

                  return (
                    <button
                      key={etudiant.id}
                      type="button"
                      onClick={() => toggleStudent(etudiant.id, blockingGroup)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all"
                      style={{
                        background: isSelected
                          ? "rgba(124,58,237,0.08)"
                          : "transparent",
                        cursor:
                          isBlocked || isWrongSpecYear
                            ? "not-allowed"
                            : "pointer",
                        border: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        opacity: isBlocked || isWrongSpecYear ? 0.5 : 1,
                      }}
                      title={
                        isBlocked
                          ? `Déjà dans le groupe "${blockingGroup}"`
                          : isWrongSpecYear
                          ? `Spécialité/année différente du groupe`
                          : ""
                      }
                    >
                      {/* Checkbox */}
                      <div
                        className="w-5 h-5 rounded border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: isSelected
                            ? "#7c3aed"
                            : isBlocked || isWrongSpecYear
                            ? "#e0ddd8"
                            : "#ccc",
                          background: isSelected
                            ? "#7c3aed"
                            : isBlocked || isWrongSpecYear
                            ? "#f5f5f5"
                            : "#fff",
                        }}
                      >
                        {isSelected && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {(isBlocked || isWrongSpecYear) && (
                          <Lock size={9} style={{ color: "#ccc" }} />
                        )}
                      </div>

                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              isBlocked || isWrongSpecYear ? "#aaa" : "#1a1a1a",
                          }}
                        >
                          {etudiant.prenom} {etudiant.nom}
                        </span>
                        <span
                          className="ml-1.5"
                          style={{ color: "#999", fontSize: "11px" }}
                        >
                          {etudiant.specialite} — {etudiant.annee}ème
                          {etudiant.classe && (
                            <span style={{ color: "#bbb" }}> · {etudiant.classe}</span>
                          )}
                        </span>
                      </div>

                      {/* Badge */}
                      {isBlocked && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            background: "#f5f5f5",
                            color: "#bbb",
                            border: "1px solid #e0ddd8",
                            fontSize: "10px",
                          }}
                        >
                          <Lock size={9} className="inline mr-1" />
                          {blockingGroup}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs" style={{ color: "#999" }}>
                Tous les étudiants d'un groupe doivent avoir la même spécialité et année. Les étudiants incompatibles sont grisés.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saveLoading}>
              {saveLoading ? "Enregistrement..." : editId ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le groupe</DialogTitle>
            <DialogDescription>
              Ce groupe sera définitivement supprimé. Les étudiants ne seront pas supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={14} /> Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
