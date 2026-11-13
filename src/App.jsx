import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import TripsProvider from "./trip_linking/context/TripsProvider";
import TripLinkingRoutes from "./trip_linking/TripLinkingRoutes";
import "./App.css";

// App shell. Add the other teams' routes here (Home/search, Compare, Saved, Login...).
function ComingSoon({ title }) {
  return (
    <main className="app-placeholder">
      <h1>{title}</h1>
      <p>This page is not built yet.</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TripsProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<ComingSoon title="Search flights" />} />
          <Route path="/linked-trips/*" element={<TripLinkingRoutes />} />
          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </TripsProvider>
    </BrowserRouter>
  );
}