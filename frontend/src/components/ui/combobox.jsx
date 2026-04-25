import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

/**
 * Combobox – searchable autocomplete input
 *
 * Props:
 *   options:       [{ value, label, sub? }]   — list of options
 *   value:         string                      — currently selected value
 *   onValueChange: (value) => void
 *   placeholder:   string
 *   searchPlaceholder: string
 *   disabled:      bool
 *   className:     string
 */
export function Combobox({
  options = [],
  value,
  onValueChange,
  placeholder = "Choisir…",
  searchPlaceholder = "Rechercher…",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSelect(opt) {
    onValueChange(String(opt.value));
    setOpen(false);
    setQuery("");
  }

  function handleToggle() {
    if (disabled) return;
    setOpen((prev) => !prev);
    setQuery("");
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all"
        style={{
          background: disabled ? "#f5f5f5" : "#fff",
          border: open ? "1.5px solid #1a1a1a" : "1px solid #e0ddd8",
          color: selected ? "#1a1a1a" : "#999",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          minHeight: "40px",
        }}
      >
        <span className="truncate text-left">
          {selected ? (
            <span>
              {selected.label}
              {selected.sub && (
                <span style={{ color: "#999", marginLeft: "6px", fontSize: "11px" }}>
                  {selected.sub}
                </span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "#999",
            flexShrink: 0,
            marginLeft: 6,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid #e0ddd8",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          }}
        >
          {/* Search input */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: "1px solid #f0ede8" }}
          >
            <Search size={13} style={{ color: "#aaa", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div
                className="px-3 py-4 text-xs text-center"
                style={{ color: "#aaa" }}
              >
                Aucun résultat
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(26,26,26,0.06)"
                        : "transparent",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background =
                          "rgba(26,26,26,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>
                      {opt.label}
                      {opt.sub && (
                        <span
                          style={{
                            color: "#aaa",
                            marginLeft: "6px",
                            fontSize: "11px",
                          }}
                        >
                          {opt.sub}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={13} style={{ color: "#1a1a1a", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
