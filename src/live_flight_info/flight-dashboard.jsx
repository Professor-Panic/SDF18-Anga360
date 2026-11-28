import { useEffect, useState } from "react";
import { getOpenSkyData } from "./opensky";

export default function FlightDashboard() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getOpenSkyData({ lamin: -35, lomin: -17, lamax: 37, lomax: 51 }, "states");
        if (!cancelled) {
          setAircraft(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true; // ignore results if the component unmounts
    };
  }, []);

  if (loading)
    return (
      <section className="live-page" role="status">
        <div className="live-card">
          <span className="live-pill">LIVE · MOJA KWA MOJA</span>
          <div className="ag-skel" style={{ height: 96, width: 200, margin: "28px auto 12px" }} />
          <p className="live-label">Tafadhali subiri… Loading aircraft</p>
        </div>
      </section>
    );
  if (error)
    return (
      <section className="live-page">
        <div className="live-card">
          <h1>We could not load live flights</h1>
          <p className="live-label">Pole! Please try again in a moment.</p>
          <p className="live-note">{error}</p>
        </div>
      </section>
    );

  console.log(aircraft); // check the data in the browser console

  return (
    <section className="live-page">
      <div className="live-card">
        <span className="live-pill">LIVE · MOJA KWA MOJA</span>
        <h1>Skies above Africa right now</h1>
        <div className="live-count">{aircraft.length}</div>
        <p className="live-label">aircraft in view</p>
        <p className="live-note">
          Live positions from the OpenSky Network. Open a linked trip to follow your own flight.
        </p>
      </div>
    </section>
  );
}