import { PROGRESS_STEPS } from "../utils/constants";

// stage 0 = not started, 1-4 = the step the flight is on now.
export default function FlightProgress({ stage }) {
  return (
    <section className="tl-card" aria-labelledby="tl-progress-title">
      <h2 id="tl-progress-title" className="tl-card__title tl-card__title--small">
        Flight progress
      </h2>
      <ol className="tl-steps">
        {PROGRESS_STEPS.map((label, index) => {
          const number = index + 1;
          const state = number < stage ? "done" : number === stage ? "current" : "upcoming";
          return (
            <li
              key={label}
              className={`tl-step tl-step--${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="tl-step__dot" aria-hidden="true">
                {state === "done" ? "✓" : number}
              </span>
              <span className="tl-step__label">
                {label}
                {state === "done" && <span className="tl-sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}