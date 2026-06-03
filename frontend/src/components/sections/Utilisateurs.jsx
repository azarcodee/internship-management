import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, User } from "lucide-react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

export function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/users.php");
      if (data && !data.error) setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const openAdd = () => {
    setForm({ name: "", email: "", password: "", role: "user" });
    setError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Tous les champs sont requis.");
      return;
    }

    const res = await apiFetch("/users.php", {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      }),
    });

    if (res && !res.error) {
      setMessage({ type: "success", text: "Utilisateur créé." });
      setModalOpen(false);
      loadUsers();
    } else {
      setError(res?.error || "Erreur lors de la création.");
    }
  };

  const handleDelete = async () => {
    const res = await apiFetch(`/users.php?id=${deleteId}`, { method: "DELETE" });
    if (res && !res.error) {
      setMessage({ type: "success", text: "Utilisateur supprimé." });
      loadUsers();
    } else {
      setMessage({ type: "error", text: res?.error || "Erreur." });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
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
          }}
        >
          {message.type === "success" ? (
            <Shield size={18} style={{ color: "#16a34a" }} />
          ) : (
            <Shield size={18} style={{ color: "#c0392b" }} />
          )}
          <span className="flex-1">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{
              background: "none",
              border: "none",
              opacity: 0.5,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1a1a1a",
            }}
          >
            Utilisateurs
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}
          >
            Gestion des comptes (admin uniquement)
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
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>

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
              {["Nom", "Email", "Rôle", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#999", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                style={{ borderBottom: "1px solid #f0ede8" }}
              >
                <td className="px-5 py-3.5 font-medium" style={{ color: "#1a1a1a" }}>
                  <div className="flex items-center gap-2">
                    {u.role === "admin" ? (
                      <Shield size={14} style={{ color: "#7c3aed" }} />
                    ) : (
                      <User size={14} style={{ color: "#2563eb" }} />
                    )}
                    {u.name}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm" style={{ color: "#666" }}>
                  {u.email}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      background:
                        u.role === "admin"
                          ? "rgba(124,58,237,0.08)"
                          : "rgba(59,130,246,0.08)",
                      color: u.role === "admin" ? "#7c3aed" : "#2563eb",
                    }}
                  >
                    {u.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => setDeleteId(u.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: "rgba(192,57,43,0.06)",
                      color: "#c0392b",
                      border: "1px solid rgba(192,57,43,0.12)",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: "#999" }}
                >
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add user dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un compte administrateur ou staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nom complet</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ahmed Benali"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="staff@example.com"
              />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: "#FFECEC",
                  color: "#c0392b",
                }}
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSave}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet utilisateur ?
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
