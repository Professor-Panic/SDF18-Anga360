import { createContext, useContext } from "react";

export const TripsContext = createContext(null);

export function useTrips() {
  const value = useContext(TripsContext);
  if (!value) throw new Error("useTrips must be used inside <TripsProvider>");
  return value;
}