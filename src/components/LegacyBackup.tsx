import { useState } from "react";
import { Download } from "lucide-react";

// Recovery only: old guest data is never used as the active account or erased.
export function LegacyBackup() {
  const [raw] = useState(() => {
    try {
      return localStorage.getItem("habit-grid.local.v1");
    } catch {
      return null;
    }
  });
  if (!raw) return null;
  function download() {
    const url = URL.createObjectURL(
      new Blob([raw!], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "habit-grid-previous-device-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="settings-section legacy-recovery"
      aria-label="Previous device data"
    >
      <h2>Your previous device data</h2>
      <p className="help-text">
        Device-only mode has been retired. Your previous data is still here.
        Download it, then sign in and use Settings → Import backup to save it to
        Firebase. Importing replaces the habits and history in that account, so
        export any existing cloud data first.
      </p>
      <button className="secondary-button" onClick={download}>
        <Download size={18} /> Download previous habits
      </button>
    </section>
  );
}
