import { useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { HABIT_ICONS, searchIcons, type HabitIconId } from "../domain/icons";
import { HabitIcon } from "./HabitIcon";
export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: HabitIconId;
  color: string;
  onChange: (icon: HabitIconId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const icons = searchIcons(query);
  const groups = [...new Set(icons.map((icon) => icon.group))];
  return (
    <fieldset className={`field icon-picker ${color}`}>
      <legend>An icon that feels right</legend>
      <button
        className="icon-picker-toggle"
        type="button"
        aria-label="Choose icon"
        aria-expanded={open}
        aria-controls="habit-icon-options"
        onClick={() => setOpen(!open)}
      >
        <span className="habit-icon">
          <HabitIcon habit={{ icon: value }} />
        </span>
        <span>
          <strong>
            {HABIT_ICONS.find((icon) => icon.id === value)?.label}
          </strong>
          <small>48 icons to make it yours</small>
        </span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {open && (
        <div id="habit-icon-options" className="icon-picker-options">
          <div className="icon-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Search icons"
              placeholder="Search icons, e.g. reading"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear icon search"
                onClick={() => setQuery("")}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <p className="sr-only" role="status">
            {icons.length} icons found
          </p>
          <div className="icon-picker-scroll">
            {groups.map((group) => (
              <section key={group} aria-label={group}>
                <h3>{group}</h3>
                <div className="icon-picker-grid">
                  {icons
                    .filter((icon) => icon.group === group)
                    .map((icon) => (
                      <button
                        type="button"
                        key={icon.id}
                        aria-label={`${icon.label} icon`}
                        title={icon.label}
                        aria-pressed={value === icon.id}
                        onClick={() => onChange(icon.id)}
                      >
                        <HabitIcon habit={{ icon: icon.id }} />
                      </button>
                    ))}
                </div>
              </section>
            ))}
            {!icons.length && (
              <p className="help-text">
                No icons found. Try “music”, “food”, or “walking”.
              </p>
            )}
          </div>
        </div>
      )}
    </fieldset>
  );
}
