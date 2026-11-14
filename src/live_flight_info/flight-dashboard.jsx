import { useEffect, useState } from "react";
import { getAccessToken, getOpenSkyData } from "./opensky";

export default function FlightDashboard() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = await getAccessToken();
        const data = await getOpenSkyData(
          token,
            { lamin: -35, lomin: -17, lamax: 37, lomax: 51 },
          "states"
        );
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

  if (loading) return <p>Loading aircraft...</p>;
  if (error) return <p>Error: {error}</p>;

  console.log(aircraft); // check the data in the browser console

  return (
    <>
      <p>{aircraft.length} aircraft in view</p>
    </>
  );
}