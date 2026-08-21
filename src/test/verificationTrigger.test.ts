import { describe, it, expect } from "vitest";
import { evaluateTrigger, detectVerificationTriggers } from "@/lib/amsce/verificationTrigger";
import { SkillConfidenceResult } from "@/lib/amsce/adaptiveConfidenceEngine";

const mod = (name: string, weight: number, evidence: number, evidential = true) => ({
  name, weight, rawEvidence: evidence, discountedEvidence: evidence,
  timestamp: null, evidential,
});

/** All five modules, with the evidential ones overridable by name. */
function result(over: {
  skill?: string; selfRating?: number; confidenceScore?: number;
  agreement?: number; evidence?: Partial<Record<string, number>>;
} = {}): SkillConfidenceResult {
  const e = over.evidence ?? {};
  const modules = [
    mod("Resume / Projects", 0.25, e["Resume / Projects"] ?? 0),
    mod("Mock Interview", 0.25, e["Mock Interview"] ?? 0),
    mod("Certificates", 0.20, e["Certificates"] ?? 0),
    mod("Career Goal Alignment", 0.15, e["Career Goal Alignment"] ?? 1, false),
    mod("Learning Activity", 0.15, e["Learning Activity"] ?? 0),
  ];
  return {
    skill: over.skill ?? "Power BI",
    skillScore: 3,
    confidenceScore: over.confidenceScore ?? 0.28,
    confidenceState: "Low",
    explainability: [],
    breakdown: {
      selfRating: over.selfRating ?? 5,
      agreement: over.agreement ?? 1,
      coverage: 0.1,
      bri: 1,
      sds: 0,
      rawEvidenceStrength: 0.1,
      modules,
    },
  };
}

describe("when the trigger fires", () => {
  it("fires for a high rating with thin evidence", () => {
    const t = evaluateTrigger(result({ selfRating: 5, confidenceScore: 0.28 }));
    expect(t).not.toBeNull();
    expect(t!.reason).toBe("thin_evidence");
  });

  it("stays quiet for a low self-rating with thin evidence", () => {
    // Rating yourself 2 with no evidence isn't overclaiming — it's an
    // accurate report of a gap. Prompting would be noise.
    expect(evaluateTrigger(result({ selfRating: 2 }))).toBeNull();
  });

  it("stays quiet when confidence is already adequate", () => {
    expect(evaluateTrigger(result({ selfRating: 5, confidenceScore: 0.6 }))).toBeNull();
  });

  it("fires on conflict even when confidence is otherwise adequate", () => {
    const t = evaluateTrigger(result({
      selfRating: 5,
      confidenceScore: 0.65,
      agreement: 0.2,
      evidence: { "Resume / Projects": 1, "Mock Interview": 0.1 },
    }));
    expect(t).not.toBeNull();
    expect(t!.reason).toBe("conflicting_evidence");
  });

  it("does not call a single source a conflict", () => {
    // Agreement is 1 with fewer than two contributors, so a lone module
    // must never be reported as disagreeing with anything.
    const t = evaluateTrigger(result({
      selfRating: 5, confidenceScore: 0.38,
      agreement: 1, evidence: { "Certificates": 1 },
    }));
    expect(t!.reason).toBe("thin_evidence");
  });
});

describe("action ranking", () => {
  it("ranks the highest-leverage action first", () => {
    const t = evaluateTrigger(result({ selfRating: 5 }))!;
    expect(t.actions.length).toBeGreaterThan(0);
    const gains = t.actions.map(a => a.projectedGain);
    expect([...gains].sort((a, b) => b - a)).toEqual(gains);
  });

  it("prefers a heavier module when all are equally absent", () => {
    // Resume and Mock Interview carry 0.25; Learning carries 0.15.
    const t = evaluateTrigger(result({ selfRating: 5 }))!;
    expect(["Resume / Projects", "Mock Interview"]).toContain(t.actions[0].module);
  });

  it("omits modules that already have full evidence", () => {
    const t = evaluateTrigger(result({
      selfRating: 5,
      evidence: { "Certificates": 1 },
    }))!;
    expect(t.actions.map(a => a.module)).not.toContain("Certificates");
  });

  it("never suggests acting on a contextual module", () => {
    // Career Goal Alignment isn't something a user can go and produce.
    const t = evaluateTrigger(result({ selfRating: 5 }))!;
    expect(t.actions.map(a => a.module)).not.toContain("Career Goal Alignment");
  });

  it("projects a real, positive gain for each suggestion", () => {
    const t = evaluateTrigger(result({ selfRating: 5 }))!;
    for (const a of t.actions) {
      expect(a.projectedGain).toBeGreaterThan(0);
      expect(a.projectedGain).toBeLessThanOrEqual(1);
    }
  });

  it("gives every action somewhere to go", () => {
    const t = evaluateTrigger(result({ selfRating: 5 }))!;
    for (const a of t.actions) {
      expect(a.href.startsWith("/"), a.module).toBe(true);
      expect(a.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ordering across a career path", () => {
  it("puts conflicts above absences", () => {
    const triggers = detectVerificationTriggers([
      result({ skill: "Thin", selfRating: 5, confidenceScore: 0.2 }),
      result({
        skill: "Conflicted", selfRating: 5, confidenceScore: 0.3, agreement: 0.1,
        evidence: { "Resume / Projects": 1, "Mock Interview": 0.1 },
      }),
    ]);
    expect(triggers[0].skill).toBe("Conflicted");
  });

  it("orders absences by how little confidence they have", () => {
    const triggers = detectVerificationTriggers([
      result({ skill: "Less bad", selfRating: 5, confidenceScore: 0.35 }),
      result({ skill: "Worse", selfRating: 5, confidenceScore: 0.1 }),
    ]);
    expect(triggers.map(t => t.skill)).toEqual(["Worse", "Less bad"]);
  });

  it("returns nothing when every skill is adequately evidenced", () => {
    expect(detectVerificationTriggers([
      result({ selfRating: 5, confidenceScore: 0.8 }),
      result({ selfRating: 3, confidenceScore: 0.2 }),
    ])).toEqual([]);
  });
});
