import { describe, it, expect, vi, beforeEach } from "vitest";
import { assessStaleness, oldestAssessment } from "@/lib/amsce/confidenceStaleness";

const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { recordHiringOutcome, buildCalibrationReport } from "@/lib/amsce/outcomeFeedback";

function table(rows: any[], capture?: (payload: any) => void) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    upsert: (payload: any) => { capture?.(payload); return chain; },
    then: (res: any, rej: any) => Promise.resolve({ data: rows, error: null }).then(res, rej),
  };
  return chain;
}

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => mockFrom.mockReset());

describe("assessment staleness", () => {
  it("treats a recent assessment as fresh", () => {
    const s = assessStaleness(daysAgo(3));
    expect(s.level).toBe("fresh");
    expect(s.shouldReassess).toBe(false);
  });

  it("flags a quarter-old assessment as ageing", () => {
    expect(assessStaleness(daysAgo(100)).level).toBe("ageing");
  });

  it("flags a half-year-old assessment as stale", () => {
    const s = assessStaleness(daysAgo(200));
    expect(s.level).toBe("stale");
    expect(s.shouldReassess).toBe(true);
  });

  it("treats a never-assessed skill as stale rather than fresh", () => {
    // Defaulting missing data to "fresh" would silently present an
    // absent assessment as a current one.
    expect(assessStaleness(null).level).toBe("stale");
    expect(assessStaleness(undefined).label).toBe("never assessed");
  });

  it("describes age in units a reader can act on", () => {
    expect(assessStaleness(daysAgo(0)).label).toBe("today");
    expect(assessStaleness(daysAgo(1)).label).toBe("yesterday");
    expect(assessStaleness(daysAgo(10)).label).toBe("10 days ago");
    expect(assessStaleness(daysAgo(60)).label).toMatch(/months? ago/);
    expect(assessStaleness(daysAgo(800)).label).toMatch(/years? ago/);
  });

  it("reports the oldest of a set, not the newest", () => {
    // A summary line must reflect the weakest assurance in the group.
    const s = oldestAssessment([daysAgo(2), daysAgo(300), daysAgo(10)]);
    expect(s.level).toBe("stale");
  });

  it("handles an empty or all-null set without throwing", () => {
    expect(oldestAssessment([]).level).toBe("stale");
    expect(oldestAssessment([null, undefined]).level).toBe("stale");
  });
});

describe("recording a hiring outcome", () => {
  const evidence = [
    { skill: "Power BI", careerPath: "data_analyst", skillScore: 4.2, selfRating: 4,
      confidenceScore: 0.8, confidenceState: "High" as const, supportingEvidence: [],
      sourcesWithEvidence: 3, totalSources: 4, lastComputedAt: daysAgo(1) },
    { skill: "SQL", careerPath: "data_analyst", skillScore: 3, selfRating: 3,
      confidenceScore: 0.4, confidenceState: "Medium" as const, supportingEvidence: [],
      sourcesWithEvidence: 1, totalSources: 4, lastComputedAt: daysAgo(1) },
    { skill: "R Basics", careerPath: "data_analyst", skillScore: 2, selfRating: 2,
      confidenceScore: 0.2, confidenceState: "Low" as const, supportingEvidence: [],
      sourcesWithEvidence: 0, totalSources: 4, lastComputedAt: daysAgo(1) },
  ];

  it("freezes a snapshot of the scores at decision time", async () => {
    // Reading live scores later would show what the engine thinks now,
    // not what this employer was shown when they decided.
    let payload: any;
    mockFrom.mockReturnValue(table([], p => { payload = p; }));

    await recordHiringOutcome("app-1", "cand-1", "emp-1", "hired", evidence);

    expect(payload.confidence_snapshot).toHaveLength(3);
    expect(payload.confidence_snapshot[0]).toMatchObject({ skill: "Power BI", confidenceScore: 0.8 });
  });

  it("averages confidence over corroborated skills only", async () => {
    // Unevidenced skills would drag the mean toward zero and make the
    // aggregate measure evidence coverage rather than confidence.
    let payload: any;
    mockFrom.mockReturnValue(table([], p => { payload = p; }));

    await recordHiringOutcome("app-1", "cand-1", "emp-1", "hired", evidence);

    expect(payload.corroborated_skills).toBe(2);
    expect(payload.mean_confidence).toBeCloseTo(0.6, 2); // (0.8 + 0.4) / 2
  });

  it("records a null mean when nothing was corroborated", async () => {
    let payload: any;
    mockFrom.mockReturnValue(table([], p => { payload = p; }));
    await recordHiringOutcome("app-1", "cand-1", "emp-1", "rejected", [evidence[2]]);
    expect(payload.mean_confidence).toBeNull();
  });
});

describe("calibration reporting", () => {
  it("refuses to interpret a small sample", async () => {
    mockFrom.mockReturnValue(table([
      { outcome: "hired", mean_confidence: 0.8 },
      { outcome: "rejected", mean_confidence: 0.3 },
    ]));

    const r = await buildCalibrationReport("emp-1");
    expect(r.sampleSize).toBe(2);
    expect(r.interpretable).toBe(false);
    expect(r.note).toMatch(/Not enough decisions/);
  });

  it("still computes the comparison for transparency", async () => {
    mockFrom.mockReturnValue(table([
      { outcome: "hired", mean_confidence: 0.8 },
      { outcome: "rejected", mean_confidence: 0.3 },
    ]));

    const r = await buildCalibrationReport("emp-1");
    expect(r.meanConfidenceHired).toBeCloseTo(0.8, 2);
    expect(r.separation).toBeCloseTo(0.5, 2);
  });

  it("marks a large sample as interpretable", async () => {
    const rows = [
      ...Array.from({ length: 20 }, () => ({ outcome: "hired", mean_confidence: 0.7 })),
      ...Array.from({ length: 20 }, () => ({ outcome: "rejected", mean_confidence: 0.4 })),
    ];
    mockFrom.mockReturnValue(table(rows));

    const r = await buildCalibrationReport("emp-1");
    expect(r.interpretable).toBe(true);
    expect(r.separation).toBeCloseTo(0.3, 2);
  });

  it("reports no separation rather than inventing one when a group is empty", async () => {
    mockFrom.mockReturnValue(table([{ outcome: "hired", mean_confidence: 0.8 }]));
    const r = await buildCalibrationReport("emp-1");
    expect(r.meanConfidenceRejected).toBeNull();
    expect(r.separation).toBeNull();
  });
});
