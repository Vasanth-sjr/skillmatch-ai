// AMSCE — Confidence Staleness (Phase 8)
//
// ── WHAT DECAY CAN AND CANNOT MEAN HERE ───────────────────────────────
//
// Evidence already decays: freshnessDiscount ages each module's
// contribution by its own timestamp every time confidence is computed.
// So a score recomputed today already reflects how old its evidence is.
//
// The gap is that scores are CACHED. A candidate who last opened Skill
// Reviews eight months ago has a stored score computed against
// eight-month-fresher evidence than it would be today, and an employer
// reading that cache sees the old number.
//
// The tempting fix is to apply a decay factor at read time. That would
// be wrong: the evidence timestamps have already been discounted once,
// and discounting again by elapsed-time-since-computation double-counts
// the same ageing. It would produce a number that looks precise and
// means nothing.
//
// So this module does not invent a decayed score. It reports how old the
// assessment is and lets that be visible — on the candidate's side as a
// prompt to reassess (which triggers a genuine recomputation), and on
// the employer's side as a plain disclosure that they're reading a
// months-old assessment. An honest "computed 8 months ago" is worth more
// than a confidently wrong adjusted figure.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type StalenessLevel = "fresh" | "ageing" | "stale";

export interface Staleness {
  level: StalenessLevel;
  daysOld: number;
  label: string;
  /** True when a recomputation would meaningfully change the result. */
  shouldReassess: boolean;
}

// Interview evidence has the shortest half-life at 12 months, so a
// quarter is roughly where a recomputation starts to move numbers.
const AGEING_AFTER_DAYS = 90;
const STALE_AFTER_DAYS = 180;

export function assessStaleness(lastComputedAt: string | null | undefined): Staleness {
  if (!lastComputedAt) {
    return { level: "stale", daysOld: Infinity, label: "never assessed", shouldReassess: true };
  }

  const daysOld = Math.max(0, Math.floor((Date.now() - new Date(lastComputedAt).getTime()) / MS_PER_DAY));

  if (daysOld >= STALE_AFTER_DAYS) {
    return { level: "stale", daysOld, label: describeAge(daysOld), shouldReassess: true };
  }
  if (daysOld >= AGEING_AFTER_DAYS) {
    return { level: "ageing", daysOld, label: describeAge(daysOld), shouldReassess: true };
  }
  return { level: "fresh", daysOld, label: describeAge(daysOld), shouldReassess: false };
}

function describeAge(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Oldest assessment across a set, for a single summary line. */
export function oldestAssessment(timestamps: (string | null | undefined)[]): Staleness {
  const valid = timestamps.filter((t): t is string => Boolean(t));
  if (valid.length === 0) return assessStaleness(null);
  const oldest = valid.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));
  return assessStaleness(oldest);
}
