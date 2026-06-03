import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Stethoscope, Search, AlertTriangle } from "lucide-react";
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
import { Combobox } from "../ui/combobox";
import { genId } from "../../data/constants";

export function Services({ services, setServices, etablissements, reload }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nom: "", etablissement_id: etablissements[0]?.id ?? "" });
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState("");

  const etablissementOptions = etablissements.map((e) => ({
    value: String(e.id),
    label: e.nom,
    sub: e.type ?? undefined,
  }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter((s) => {
      const etab = etablissements.find((e) => e.id === s.etablissement_id);
      return `${s.nom} ${etab?.nom ?? ""} ${etab?.type ?? ""} ${etab?.wilaya ?? ""}`.toLowerCase().includes(q);
    });
  }, [services, etablissements, search]);

  function openAdd() {
    setForm({ nom: "", etablissement_id: etablissements[0]?.id ?? "" });
    setEditId(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(s) {
    setForm({ nom: s.nom, etablissement_id: s.etablissement_id });
    setEditId(s.id);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      setFormError("Le nom du service est requis.");
      return;
    }
    const data = { nom: form.nom.trim(), etablissement_id: Number(form.etablissement_id) };
    if (editId) {
      const result = await apiFetch(`/services.php?id=${editId}`, { method: "PUT", body: JSON.stringify(data) });
      if (result && !result.error) { await reload(); setModalOpen(false); }
      else setFormError(result?.error ?? "Erreur lors de la modification.");
    } else {
      const result = await apiFetch("/services.php", { method: "POST", body: JSON.stringify(data) });
      if (result && !result.error) { await reload(); setModalOpen(false); }
      else setFormError(result?.error ?? "Erreur lors de l'ajout.");
    }
  }

  async function handleDelete() {
    const result = await apiFetch(`/services.php?id=${deleteId}`, { method: "DELETE" });
    if (result && !result.error) await reload();
    else setServices((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
  }

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setFormError("");
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#999" }} />
        <input
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
          style={{ background: "#faf9f7", border: "1px solid #e0ddd8", color: "#1a1a1a", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
          placeholder="Rechercher par service, établissement, type ou wilaya…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>Services</h2>
          <p className="text-sm mt-1" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{services.length} service(s) enregistré(s)</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{ background: "#1a1a1a", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1a1a1a"; }}>
          <Plus size={15} /> Ajouter
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden bg-white" style={{ border: "1px solid #f0ede8", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #f0ede8" }}>
              {["ID", "Nom du service", "Établissement", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: "#999" }}>Aucun service trouvé.</td></tr>}
            {filtered.map((s, i) => {
              const etab = etablissements.find((e) => e.id === s.etablissement_id);
              return (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f0ede8" : "none" }}>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#999" }}>{s.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={14} style={{ color: "#059669" }} />
                      <span className="font-semibold" style={{ color: "#1a1a1a" }}>{s.nom}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>{etab?.nom ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: "rgba(59,130,246,0.08)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.15)" }}>
                        <Pencil size={12} /> Modifier
                      </button>
                      <button onClick={() => setDeleteId(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{ background: "rgba(192,57,43,0.06)", color: "#c0392b", border: "1px solid rgba(192,57,43,0.12)" }}>
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

      {/* Modal Ajout/Modification */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le service" : "Ajouter un service"}</DialogTitle>
            <DialogDescription>Associez le service à un établissement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nom du service *</Label>
              <Input value={form.nom} onChange={(e) => setField("nom", e.target.value)} placeholder="Réanimation" />
            </div>
            <div>
              <Label>Établissement</Label>
              <Combobox options={etablissementOptions} value={String(form.etablissement_id)} onValueChange={(v) => setField("etablissement_id", v)}
                placeholder="Choisir un établissement…" searchPlaceholder="Taper le nom…" />
            </div>
            {formError && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: "#FFF6E6", border: "1px solid rgba(251,191,36,0.35)", color: "#92400E" }}>
                <AlertTriangle size={14} style={{ color: "#b8860b", flexShrink: 0, marginTop: 1 }} />
                <span>{formError}</span>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editId ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Suppression */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le service</DialogTitle>
            <DialogDescription>Ce service sera définitivement supprimé.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 size={14} /> Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
