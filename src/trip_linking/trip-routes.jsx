import { Route, Routes } from "react-router-dom";
import Navbar from "../components/Navbar";
import TripsProvider from "./context/TripsProvider";
import TripLinkingRoutes from "./TripLinkingRoutes";
import "./App.css";

function ComingSoon({ title }) {
  return (
    <main className="app-placeholder">
      <h1>{title}</h1>
      <p>This page is not built yet.</p>
    </main>
  );
}

export default function TripProvider() {
  return (
    <TripsProvider>
      <Navbar />

      <Routes>
        <Route index element={<ComingSoon title="Search flights" />} />
        <Route path="linked-trips/*" element={<TripLinkingRoutes />} />
        <Route path="*" element={<ComingSoon title="Page not found" />} />
      </Routes>
    </TripsProvider>
  );
}