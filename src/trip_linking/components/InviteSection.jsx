import { useState } from "react";
import InviteCodeCard from "./InviteCodeCard";
import { formatInviteCode } from "../utils/inviteCode";
import { ROLE_LABELS } from "../utils/constants";

const ROLES = ["picker-upper", "driver"];

// Invite code + its state + a button for a new one (codes are single-use, 15 minutes).
// The traveller picks who the next code is for.
export default function InviteSection({ trip, shareText, onRefresh, large = false }) {
  const invite = trip.invite;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState(null);

  if (!invite) return null;

  // Default the next code to the other role once this one has been used.
  const nextRole = role ?? (invite.used ? ROLES.find((r) => r !== invite.role) : invite.role);

  const expiresAt = new Date(invite.expires_at);
  const timeText = expiresAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  async function handleRefresh() {
    setBusy(true);
    setError("");
    const result = await onRefresh(trip.id, nextRole);
    setBusy(false);
    if (result.ok) setRole(null);
    else setError(result.message);
  }

  let note;
  if (invite.used) {
    note = `${invite.used_by_name ?? "Someone"} joined as ${ROLE_LABELS[invite.role].toLowerCase()} with this code. Get a new code to invite someone else.`;
  } else if (invite.active) {
    note = `For the ${ROLE_LABELS[invite.role].toLowerCase()}. Works once, until ${timeText}.`;
  } else {
    note = "This code has expired. Get a new one to invite someone.";
  }

  return (
    <>
      {invite.active && (
        <InviteCodeCard large={large} code={formatInviteCode(invite.code)} shareText={shareText(formatInviteCode(invite.code))} />
      )}
      <p className="tl-card__text" role="status">{note}</p>

      {onRefresh && !invite.active && (
        <>
          <div className="tl-toggle" role="radiogroup" aria-label="Who is the new code for?">
            {ROLES.map((value) => (
              <label key={value} className={nextRole === value ? "tl-toggle__option is-selected" : "tl-toggle__option"}>
                <input
                  type="radio"
                  name="next-invite-role"
                  value={value}
                  checked={nextRole === value}
                  onChange={() => setRole(value)}
                />
                {ROLE_LABELS[value]}
              </label>
            ))}
          </div>
          <button type="button" className="tl-btn tl-btn--outline tl-btn--block" onClick={handleRefresh} disabled={busy}>
            {busy ? "Getting a code…" : "Get a new code"}
          </button>
        </>
      )}
      {onRefresh && invite.active && (
        <button type="button" className="tl-btn tl-btn--ghost tl-btn--block" onClick={handleRefresh} disabled={busy}>
          {busy ? "Getting a code…" : "Replace with a new code"}
        </button>
      )}
      {error && <p className="tl-error" role="alert">{error}</p>}
    </>
  );
}
