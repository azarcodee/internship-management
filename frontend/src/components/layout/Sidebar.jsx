import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  ClipboardList,
  BarChart3,
  Stethoscope,
  LogOut,
  User,
} from "lucide-react";
import { NAV_ITEMS } from "../../data/constants";

const ICONS = {
  LayoutDashboard,
  GraduationCap,
  Building2,
  ClipboardList,
  BarChart3,
  Stethoscope,
};

export function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen w-64 flex flex-col z-30"
      style={{
        background: "var(--bg-deep)",
        borderRight: "1px solid var(--border-dark)",
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-7"
        style={{ borderBottom: "1px solid var(--border-dark)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#1a1a1a" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <span
              className="text-lg font-semibold tracking-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "var(--text-on-dark)",
              }}
            >
              INSFP
            </span>
            <p
              className="text-[10px] mt-0.5"
              style={{
                color: "var(--text-muted-dark)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Gestion des stages
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon, label }) => {
          const Icon = ICONS[icon];
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-left"
              style={{
                background: active ? "#1a1a1a" : "transparent",
                color: active ? "#fff" : "var(--text-muted-dark)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "var(--text-on-dark)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted-dark)";
                }
              }}
            >
              {Icon && <Icon size={16} />}
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div
        className="px-4 py-5"
        style={{ borderTop: "1px solid var(--border-dark)" }}
      >
        {user && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#1a1a1a" }}
            >
              <User size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{
                  color: "var(--text-on-dark)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {user.email}
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--text-muted-dark)" }}
              >
                Administrateur
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer"
          style={{
            color: "var(--text-muted-dark)",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#c0392b";
            e.currentTarget.style.background = "rgba(192,57,43,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted-dark)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={14} />
          Se déconnecter
        </button>
        <p
          className="text-[10px] mt-3 px-3"
          style={{ color: "var(--text-muted-dark)" }}
        >
          Mostaganem
        </p>
      </div>
    </aside>
  );
}
