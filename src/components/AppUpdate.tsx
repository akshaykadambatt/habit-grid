import { useRegisterSW } from "virtual:pwa-register/react";
export function AppUpdate() {
  const {
    needRefresh: [needed, setNeeded],
    updateServiceWorker,
  } = useRegisterSW();
  return needed ? (
    <div className="update-notice" role="status">
      <span>A fresh version is ready.</span>
      <button onClick={() => void updateServiceWorker(true)}>Refresh</button>
      <button onClick={() => setNeeded(false)}>Later</button>
    </div>
  ) : null;
}
