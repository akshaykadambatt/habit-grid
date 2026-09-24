import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { HABIT_PALETTE, type Color } from "../domain/colors";
export function ColorPicker({
  value,
  onChange,
}: {
  value: Color;
  onChange: (color: Color) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = HABIT_PALETTE.find((color) => color.id === value)!;
  return (
    <fieldset className="field curated-colors">
      <legend>A little color</legend>
      <button
        type="button"
        className="color-picker-toggle"
        aria-label="Choose color"
        aria-expanded={open}
        aria-controls="habit-color-options"
        onClick={() => setOpen(!open)}
      >
        <span className="selected-color" style={{ background: selected.hex }}>
          <Check size={20} />
        </span>
        <span>
          <strong>{selected.label}</strong>
          <small>18 thoughtfully chosen shades</small>
        </span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {open && (
        <div id="habit-color-options" className="curated-color-options">
          {(["Fresh", "Soft", "Warm"] as const).map((group) => (
            <section key={group} aria-label={`${group} colors`}>
              <h3>{group}</h3>
              <div className="curated-color-grid">
                {HABIT_PALETTE.filter((color) => color.group === group).map(
                  (color) => (
                    <button
                      type="button"
                      key={color.id}
                      aria-label={`${color.label} color`}
                      title={color.label}
                      aria-pressed={value === color.id}
                      onClick={() => onChange(color.id)}
                    >
                      <span style={{ background: color.hex }}>
                        {value === color.id && <Check size={20} />}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </section>
          ))}
          <p className="help-text">
            Soft fills, clear text. Every shade works with your history grid.
          </p>
        </div>
      )}
    </fieldset>
  );
}
