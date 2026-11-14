import { useState } from "react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

export default function InviteCodeCard({ code, shareText, large = false }) {
  const { copied, copy } = useCopyToClipboard();
  const [message, setMessage] = useState("");

  async function handleShare() {
    setMessage("");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Anga360 trip",
          text: shareText,
        });
        setMessage("Invitation shared successfully.");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    const success = await copy(shareText);

    setMessage(
      success
        ? "Invitation copied! You can now share it on WhatsApp."
        : "Could not copy invitation. Please try again."
    );
  }

  async function handleCopyCode() {
    setMessage("");
    const success = await copy(code);

    setMessage(
      success
        ? "Invite code copied successfully!"
        : "Could not copy code. Please try again."
    );
  }

  return (
    <div className={large ? "tl-invite tl-invite--large" : "tl-invite"}>
      <p className="tl-invite__label">Your invite code</p>

      <p className="tl-invite__code" aria-label={`Invite code ${code.split("").join(" ")}`}>
        {code}
      </p>

      <button
        type="button"
        className={large ? "tl-btn tl-btn--primary tl-btn--block" : "tl-btn tl-btn--outline tl-btn--block"}
        onClick={handleCopyCode}
      >
        {copied ? "Code copied" : "Copy code"}
      </button>

      {shareText && (
        <button
          type="button"
          className="tl-btn tl-btn--outline tl-btn--block"
          onClick={handleShare}
        >
          Share code
        </button>
      )}

      {message && (
        <p className="tl-card__text" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
