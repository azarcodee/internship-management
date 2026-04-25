import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, MapPin, Tag } from "lucide-react";
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
import { genId, ETABLISSEMENT_TYPES } from "../../data/constants";

const EMPTY_FORM = { nom: "", type: "AUTRE", wilaya: "", adresse: "" };

const TYPE_COLORS = {
  CHU: { bg: "rgba(124,58,237,0.08)", color: "#7c3aed" },
  EPH: { bg: "rgba(59,130,246,0.08)", color: "#2563eb" },
  EPSP: { bg: "rgba(6,182,212,0.08)", color: "#0891b2" },
  EHS: { bg: "rgba(234,88,12,0.08)", color: "#ea580c" },
  OHU: { bg: "rgba(34,197,94,0.08)", color: "#16a34a" },
  AUTRE: { bg: "rgba(100,116,139,0.08)", color: "#64748b" },
};

export function Etablissements({
  etablissements,
  setEtablissements,
  services,
  reload,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState(null);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setModalOpen(true);
  }
  function openEdit(h) {
    setForm({
      nom: h.nom,
      type: h.type,
      wilaya: h.wilaya ?? "",
      adresse: h.adresse ?? "",
    });
    setEditId(h.id);
    setModalOpen(true);
  }
  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  async function handleSave() {
    const data = {
      ...form,
      adresse: form.adresse || null,
      wilaya: form.wilaya || null,
    };
    if (editId) {
      const result = await apiFetch(`/etablissements.php?id=${editId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
      } else {
        setEtablissements((prev) =>
          prev.map((h) => (h.id === editId ? { ...data, id: editId } : h)),
        );
      }
    } else {
      const result = await apiFetch("/etablissements.php", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (result && !result.error) {
        await reload();
      } else {
        setEtablissements((prev) => [...prev, { ...data, id: genId() }]);
      }
    }
    setModalOpen(false);
  }
  async function handleDelete() {
    const result = await apiFetch(`/etablissements.php?id=${deleteId}`, {
      method: "DELETE",
    });
    if (result && !result.error) {
      await reload();
    } else {
      setEtablissements((prev) => prev.filter((h) => h.id !== deleteId));
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1a1a1a",
            }}
          >
            Établissements
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}
          >
            {etablissements.length} établissement(s) partenaire(s)
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {etablissements.map((h) => {
          const serviceCount = services.filter(
            (s) => s.etablissement_id === h.id,
          ).length;
          const tc = TYPE_COLORS[h.type] ?? TYPE_COLORS.AUTRE;
          return (
            <div
              key={h.id}
              className="rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 bg-white"
              style={{
                border: "1px solid #f0ede8",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(59,130,246,0.08)" }}
                >
                  <Building2 size={22} style={{ color: "#2563eb" }} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(h)}
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
                    onClick={() => setDeleteId(h.id)}
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
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h3
                  className="font-semibold text-base leading-snug"
                  style={{
                    color: "#1a1a1a",
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {h.nom}
                </h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: tc.bg, color: tc.color }}
                >
                  {h.type}
                </span>
              </div>

              <div className="space-y-2 mb-5">
                {h.wilaya && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "#666" }}
                  >
                    <MapPin size={13} className="shrink-0" />
                    <span>Wilaya de {h.wilaya}</span>
                  </div>
                )}
                {h.adresse && (
                  <div
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "#666" }}
                  >
                    <Tag size={13} className="shrink-0" />
                    <span>{h.adresse}</span>
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.10)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#2563eb" }}
                >
                  Services rattachés
                </span>
                <span
                  className="text-xl font-semibold"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "#2563eb",
                  }}
                >
                  {serviceCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Modifier l'établissement" : "Ajouter un établissement"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de l'établissement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nom</Label>
              <Input
                value={form.nom}
                onChange={(e) => setField("nom", e.target.value)}
                placeholder="CHU Oran"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField("type", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ETABLISSEMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wilaya</Label>
                <Input
                  value={form.wilaya}
                  onChange={(e) => setField("wilaya", e.target.value)}
                  placeholder="Oran"
                />
              </div>
            </div>
            <div>
              <Label>Adresse (optionnelle)</Label>
              <Input
                value={form.adresse}
                onChange={(e) => setField("adresse", e.target.value)}
                placeholder="12 Rue…"
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

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l'établissement</DialogTitle>
            <DialogDescription>
              Cet établissement sera définitivement supprimé.
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
