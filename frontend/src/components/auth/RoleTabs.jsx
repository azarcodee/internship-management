export default function RoleTabs({ role, onChange }) {
  return (
    <div className="role-tabs">
      <button
        className={role === "admin" ? "active" : ""}
        onClick={() => onChange("admin")}
      >
        Administrateur
      </button>
      <button
        className={role === "user" ? "active" : ""}
        onClick={() => onChange("user")}
      >
        Étudiant
      </button>
    </div>
  );
}