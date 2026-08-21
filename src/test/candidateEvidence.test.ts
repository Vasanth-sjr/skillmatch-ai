import { describe, it, expect, vi, beforeEach } from "vitest";

// The employer view reads Supabase directly, so stub the client at the
// module boundary and assert on what the loaders derive from raw rows.
const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { loadCandidateSkillEvidence, loadCandidateEvidenceSummaries } from "@/lib/amsce/candidateEvidence";

/**
 * A PostgREST-shaped stub: every filter returns the builder, and the
 * builder itself is awaitable. Modelling it as "the last call resolves"
 * broke as soon as production chained .in().eq(), so the chain has to
 * stay chainable at every step.
 */
function scoresTable(rows: any[], onIn?: (ids: string[]) => void) {
  const result = { data: rows, error: null as any };
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    in: (_col: string, ids: string[]) => { onIn?.(ids); return chain; },
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

function failingTable(message: string) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    in: () => chain,
    then: (resolve: any, reject: any) =>
      Promise.resolve({ data: null, error: { message } }).then(resolve, reject),
  };
  return chain;
}

const breakdown = (modules: { evidential?: boolean; discountedEvidence: number }[], selfRating = 4) => ({
  selfRating,
  modules: modules.map((m, i) => ({
    name: `m${i}`,
    weight: 0.25,
    rawEvidence: m.discountedEvidence,
    discountedEvidence: m.discountedEvidence,
    evidential: m.evidential ?? true,
  })),
});

beforeEach(() => mockFrom.mockReset());

describe("employer-facing skill evidence", () => {
  it("surfaces only corroborating lines, never the absences", async () => {
    // A recruiter should see what WAS found. Listing every "not found in
    // profile" line invites reading gaps in our data collection as
    // doubt about the candidate.
    mockFrom.mockReturnValue(scoresTable([{
      skill: "Power BI",
      career_path: "data_analyst",
      skill_score: "4.2",
      confidence_score: "0.75",
      confidence_state: "High",
      explainability: [
        "✓ Backed by \"PowerBi\", confirmed with the issuer",
        "⚠ Not found anywhere in your profile",
        "○ Not yet demonstrated in a Mock Interview answer",
        "✓ Core skill for your selected career path",
      ],
      evidence_breakdown: breakdown([{ discountedEvidence: 1 }, { discountedEvidence: 0 }]),
      last_computed_at: "2026-08-21T00:00:00Z",
    }]));

    const [row] = await loadCandidateSkillEvidence("cand-1");
    expect(row.supportingEvidence).toHaveLength(2);
    expect(row.supportingEvidence.every(l => l.startsWith("✓"))).toBe(true);
    expect(row.supportingEvidence.join()).not.toContain("Not found");
  });

  it("counts how many independent sources contributed", async () => {
    mockFrom.mockReturnValue(scoresTable([{
      skill: "Docker", career_path: "devops_cloud",
      skill_score: "3.5", confidence_score: "0.5", confidence_state: "Medium",
      explainability: [],
      evidence_breakdown: breakdown([
        { discountedEvidence: 1 },
        { discountedEvidence: 0.6 },
        { discountedEvidence: 0 },
        { discountedEvidence: 0 },
      ]),
      last_computed_at: "2026-08-21T00:00:00Z",
    }]));

    const [row] = await loadCandidateSkillEvidence("cand-1");
    expect(row.sourcesWithEvidence).toBe(2);
    expect(row.totalSources).toBe(4);
  });

  it("excludes contextual modules from the source count", async () => {
    // Career Goal Alignment says a skill matters to the candidate, not
    // that they have it — counting it would inflate the evidence tally.
    mockFrom.mockReturnValue(scoresTable([{
      skill: "SQL", career_path: "data_analyst",
      skill_score: "3", confidence_score: "0.4", confidence_state: "Medium",
      explainability: [],
      evidence_breakdown: breakdown([
        { discountedEvidence: 1 },
        { discountedEvidence: 1, evidential: false },
      ]),
      last_computed_at: "2026-08-21T00:00:00Z",
    }]));

    const [row] = await loadCandidateSkillEvidence("cand-1");
    expect(row.totalSources).toBe(1);
    expect(row.sourcesWithEvidence).toBe(1);
  });

  it("exposes the self-rating alongside the calibrated score", async () => {
    mockFrom.mockReturnValue(scoresTable([{
      skill: "React", career_path: "frontend_dev",
      skill_score: "2.8", confidence_score: "0.3", confidence_state: "Low",
      explainability: [],
      evidence_breakdown: breakdown([{ discountedEvidence: 0 }], 5),
      last_computed_at: "2026-08-21T00:00:00Z",
    }]));

    const [row] = await loadCandidateSkillEvidence("cand-1");
    expect(row.selfRating).toBe(5);
    expect(row.skillScore).toBe(2.8);
  });

  it("returns an empty list rather than throwing when the query fails", async () => {
    mockFrom.mockReturnValue(failingTable("denied"));
    await expect(loadCandidateSkillEvidence("cand-1")).resolves.toEqual([]);
  });
});

describe("batched list summaries", () => {
  it("avoids querying at all for an empty candidate list", async () => {
    const result = await loadCandidateEvidenceSummaries([]);
    expect(result).toEqual({});
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("counts only skills that have at least one corroborating source", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "skill_confidence_scores") {
        return scoresTable([
          { user_id: "a", evidence_breakdown: breakdown([{ discountedEvidence: 1 }]) },
          { user_id: "a", evidence_breakdown: breakdown([{ discountedEvidence: 0 }]) },
          { user_id: "b", evidence_breakdown: breakdown([{ discountedEvidence: 0 }]) },
        ]);
      }
      return scoresTable([{ user_id: "a", status: "verified" }]);
    });

    const s = await loadCandidateEvidenceSummaries(["a", "b"]);
    expect(s["a"].corroboratedSkills).toBe(1);
    expect(s["a"].verifiedCertificates).toBe(1);
    expect(s["b"]?.corroboratedSkills ?? 0).toBe(0);
  });

  it("deduplicates repeated candidate ids", async () => {
    let capturedIds: string[] = [];
    mockFrom.mockImplementation(() => scoresTable([], ids => { capturedIds = ids; }));

    await loadCandidateEvidenceSummaries(["a", "a", "b", "", "b"]);
    expect(capturedIds).toEqual(["a", "b"]);
  });
});
