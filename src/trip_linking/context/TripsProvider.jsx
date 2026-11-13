import { useCallback, useMemo, useState } from "react";
import { TripsContext } from "./tripsContext";
import { INITIAL_TRIPS } from "../data/mockTrips";
import { normalizeInviteCode } from "../utils/inviteCode";
import { firstName, nowTime } from "../utils/format";
import { ROLE_LABELS } from "../utils/constants";

const INVITEE_ROLES = ["picker-upper", "driver"];

export default function TripsProvider({ children }) {
  const [trips, setTrips] = useState(INITIAL_TRIPS);

  const addTrip = useCallback((trip) => {
    setTrips((previousTrips) => [trip, ...previousTrips]);
  }, []);

  const joinTripByCode = useCallback(
    (rawCode, participant = {}) => {
      const code = normalizeInviteCode(rawCode);
      const name = participant.name?.trim();
      const role = participant.role;

      if (!code) {
        return {
          ok: false,
          message: "Enter the 6-character invite code, for example K7F-3QX.",
        };
      }

      if (!name) {
        return {
          ok: false,
          message: "Enter your name to join the trip.",
        };
      }

      if (!INVITEE_ROLES.includes(role)) {
        return {
          ok: false,
          message: "Choose whether you are the picker-upper or driver.",
        };
      }

      const trip = trips.find(
        (item) => normalizeInviteCode(item.inviteCode) === code,
      );

      if (!trip) {
        return {
          ok: false,
          message: "That code is not valid or has expired. Check it with the traveller and try again.",
        };
      }

      const people = trip.people ?? [];

      const alreadyJoined = people.some(
        (person) =>
          person.name?.trim().toLowerCase() === name.toLowerCase(),
      );

      if (trip.traveller?.name?.trim().toLowerCase() === name.toLowerCase() ||
          alreadyJoined) {
        return {
          ok: false,
          message: "This person is already part of the trip. Use a different name.",
        };
      }

      const roleOccupied = people.some(
        (person) =>
          person.role === role && person.status !== "pending",
      );

      if (roleOccupied) {
        return {
          ok: false,
          message: `The ${ROLE_LABELS[role]} role has already been filled.`,
        };
      }

      const time = nowTime();
      const newPerson = { name, role, status: "linked" };

      setTrips((previousTrips) =>
        previousTrips.map((item) => {
          if (item.id !== trip.id) return item;

          const updatedPeople = [...(item.people ?? [])];

          const pendingIndex = updatedPeople.findIndex(
            (person) =>
              person.status === "pending" && person.role === role,
          );

          if (pendingIndex >= 0) {
            updatedPeople[pendingIndex] = newPerson;
          } else {
            updatedPeople.push(newPerson);
          }

          return {
            ...item,
            people: updatedPeople,
            updates: [
              {
                time,
                title: "Participant linked",
                text: `${name} joined as ${ROLE_LABELS[role]}.`,
              },
              ...(item.updates ?? []),
            ],
          };
        }),
      );

      return { ok: true, tripId: trip.id, role };
    },
    [trips],
  );

  const markOut = useCallback((tripId) => {
    const time = nowTime();

    setTrips((previousTrips) =>
      previousTrips.map((trip) => {
        if (trip.id !== tripId || trip.imOut) return trip;

        const travellerName = firstName(
          trip.traveller?.name ?? "The traveller",
        );

        return {
          ...trip,
          imOut: true,
          imOutAt: time,
          updates: [
            {
              time,
              title: "I'm out",
              text: `${travellerName} has cleared immigration and baggage.`,
            },
            ...(trip.updates ?? []),
          ],
        };
      }),
    );
  }, []);

  const value = useMemo(
    () => ({ trips, addTrip, joinTripByCode, markOut }),
    [trips, addTrip, joinTripByCode, markOut],
  );

  return (
    <TripsContext.Provider value={value}>
      {children}
    </TripsContext.Provider>
  );
}
