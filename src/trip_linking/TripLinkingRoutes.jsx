import { Route, Routes } from "react-router-dom";
import CreateTrip from "./pages/CreateTrip";
import LinkedTrips from "./pages/LinkedTrips";
import TripDetails from "./pages/TripDetails";
import "./trip-linking.css";

// Mounted in App.jsx at /linked-trips/*, inside <TripsProvider>.
export default function TripLinkingRoutes() {
  return (
    <Routes>
      <Route index element={<LinkedTrips />} />
      <Route path="new" element={<CreateTrip />} />
      <Route path=":tripId" element={<TripDetails />} />
    </Routes>
  );
}