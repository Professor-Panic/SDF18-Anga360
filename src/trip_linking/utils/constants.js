// Shared labels and config for Trip Linking.

export const ROLE_LABELS = {
  traveller: "Traveller",
  "picker-upper": "Picker-upper",
  driver: "Driver",
};

// stage: how far along the 4-step progress bar the flight is (0 = not started).
export const STATUS = {
  not_departed: { label: "Not yet departed", stage: 0, tone: "neutral" },
  departed: { label: "Departed", stage: 1, tone: "info" },
  in_air: { label: "In the air", stage: 2, tone: "info" },
  landed: { label: "Landed", stage: 3, tone: "success" },
  at_gate: { label: "At the gate", stage: 4, tone: "success" },
};

export const PROGRESS_STEPS = ["Departed", "In the air", "Landed", "At the gate"];

// Minutes the picker-upper needs. The team still has to agree real values
// (see "Pickup estimation" in the PRD open items).
export const DEFAULT_ALLOWANCES = { traffic: 35, parking: 10, walk: 10 };

// Mock "logged in" user until real accounts exist.
export const CURRENT_USER = { name: "Amina Otieno" };