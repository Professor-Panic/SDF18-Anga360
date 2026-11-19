import { useEffect, useState } from "react";
import "./OfflineBanner.css";

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

// Shown at the top of the app while the device has no connection.
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      You're offline. Live flights, the map, trips and saved flights need a connection.
      Recent searches may still be available.
    </div>
  );
}
