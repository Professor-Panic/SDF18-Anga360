import { STATUS } from "../utils/constants";

export default function StatusPill({ status }) {
  const { label, tone } = STATUS[status];
  return <span className={`tl-pill tl-pill--${tone}`}>{label}</span>;
}