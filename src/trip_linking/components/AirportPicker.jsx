import { useEffect, useMemo, useRef, useState } from "react";
import { AIRPORTS } from "../utils/airports";

const ALL = Object.entries(AIRPORTS)
  .map(([code, a]) => ({ code, city: a.city, name: a.name }))
  .sort((a, b) => `${a.city}${a.code}`.localeCompare(`${b.city}${b.code}`));

const label = (a) => `${a.city} (${a.code})`;

// Best matches first: code starts with the text, then city starts with it, then anywhere.
function filterAirports(text) {
  const q = text.trim().toLowerCase();
  if (!q) return ALL;
  const rank = (a) => {
    const code = a.code.toLowerCase();
    const city = a.city.toLowerCase();
    if (code === q) return 0;
    if (code.startsWith(q)) return 1;
    if (city.startsWith(q)) return 2;
    if (`${city} ${code} ${a.name.toLowerCase()}`.includes(q)) return 3;
    return -1;
  };
  return ALL.map((a) => [a, rank(a)])
    .filter(([, r]) => r >= 0)
    .sort((x, y) => x[1] - y[1])
    .map(([a]) => a);
}

// A text box that filters a list as you type. `value` is an airport code ("" = none),
// and onChange receives a code too, so it drops in where the old <select> was.
export default function AirportPicker({ id, label: fieldLabel, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const selected = value ? ALL.find((a) => a.code === value) : null;
  const matches = useMemo(() => filterAirports(query), [query]);
  const listId = `${id}-list`;

  // While the list is open we show what the person is typing; otherwise the chosen airport.
  const shown = open ? query : selected ? label(selected) : "";

  // Keep the highlighted row visible when arrowing through a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    setQuery("");
    setActive(0);
    setOpen(true);
  }

  function choose(airport) {
    onChange(airport ? airport.code : "");
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => Math.min(Math.max(i + step, 0), matches.length - 1));
    } else if (e.key === "Enter" && open) {
      e.preventDefault(); // don't submit the form while picking
      if (matches[active]) choose(matches[active]);
    } else if (e.key === "Escape" && open) {
      setOpen(false);
    }
  }

  return (
    <div className="tl-field tl-combo">
      <label htmlFor={id}>{fieldLabel}</label>
      <div className="tl-combo__box">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-opt-${matches[active].code}` : undefined}
          autoComplete="off"
          placeholder="Search city or code"
          disabled={disabled}
          value={shown}
          onFocus={openList}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            className="tl-combo__clear"
            aria-label={`Clear ${fieldLabel}`}
            // mousedown (not click) so the input keeps focus and onBlur doesn't swallow it
            onMouseDown={(e) => {
              e.preventDefault();
              choose(null);
            }}
          >
            ×
          </button>
        )}
        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            className="tl-combo__list"
            aria-label={fieldLabel}
            onMouseDown={(e) => e.preventDefault()} // clicking an option must not blur the input first
          >
            {matches.length === 0 && <li className="tl-combo__empty">No airports match “{query}”</li>}
            {matches.map((a, i) => (
              <li
                key={a.code}
                id={`${id}-opt-${a.code}`}
                role="option"
                aria-selected={a.code === value}
                className={`tl-combo__option${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(a)}
              >
                <strong>{label(a)}</strong>
                <span>{a.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
