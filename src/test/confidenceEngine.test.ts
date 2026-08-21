import { describe, it, expect } from "vitest";
import { computeSkillConfidence, ComputeConfidenceParams } from "@/lib/amsce/adaptiveConfidenceEngine";
import { computeAgreement, computeCoverage, computeBehavioralReliabilityIndex } from "@/lib/amsce/crossModalConsistency";
import { CertificateEvidence } from "@/lib/certificates/certificateEvidence";

const VERIFIED_POWERBI: CertificateEvidence = {
  name: "Analysis and Visualization of Data with Power BI",
  issuer: "Coursera",
  issueDate: "",
  expiryDate: "",
  trustLevel: "verified",
};

const base = (over: Partial<ComputeConfidenceParams> = {}): ComputeConfidenceParams => ({
  skillLabel: "Power BI",
  selfRating: 3,
  ratingHistory: [3],
  careerGoal: "cybersecurity" as any,
  profileSkills: [],
  experience: [],
  projects: [],
  interviewEvidence: [],
  learningEvidence: [],
  certificates: [],
  ...over,
});

describe("evidence must never reduce confidence", () => {
  it("raises confidence when a verified certificate is added", () => {
    // REGRESSION: Agreement originally ran across every module including
    // silent ones, so a zero behaved like a dissenting vote. Adding a
    // verified certificate dropped Agreement from 0.88 to 0.54 and LOWERED
    // confidence by 0.12 — the system punished users for having evidence.
    const without = computeSkillConfidence(base());
    const with_ = computeSkillConfidence(base({ certificates: [VERIFIED_POWERBI] }));

    expect(with_.confidenceScore).toBeGreaterThan(without.confidenceScore);
    expect(with_.skillScore).toBeGreaterThan(without.skillScore);
  });

  it("holds for every evidence module independently", () => {
    const without = computeSkillConfidence(base()).confidenceScore;

    const withResume = computeSkillConfidence(base({
      profileSkills: ["Power BI"],
      experience: [{ title: "Analyst", description: "Built Power BI dashboards", current: true }],
    })).confidenceScore;

    const withInterview = computeSkillConfidence(base({
      interviewEvidence: [{ density: 0.8, answeredAt: new Date().toISOString() }],
    })).confidenceScore;

    const withLearning = computeSkillConfidence(base({
      learningEvidence: [{ engagedAt: new Date().toISOString() }, { engagedAt: new Date().toISOString() }],
    })).confidenceScore;

    expect(withResume, "resume evidence must help").toBeGreaterThan(without);
    expect(withInterview, "interview evidence must help").toBeGreaterThan(without);
    expect(withLearning, "learning evidence must help").toBeGreaterThan(without);
  });

  it("ranks more corroborating modules above fewer", () => {
    const one = computeSkillConfidence(base({ certificates: [VERIFIED_POWERBI] })).confidenceScore;
    const three = computeSkillConfidence(base({
      certificates: [VERIFIED_POWERBI],
      profileSkills: ["Power BI"],
      experience: [{ title: "Analyst", description: "Built Power BI reports", current: true }],
      interviewEvidence: [{ density: 0.9, answeredAt: new Date().toISOString() }],
    })).confidenceScore;

    expect(three).toBeGreaterThan(one);
  });
});

describe("absence is not disagreement", () => {
  it("ignores silent modules when measuring agreement", () => {
    // One module speaking strongly among four silent ones is not conflict.
    expect(computeAgreement([1, 0, 0, 0])).toBe(1);
    expect(computeAgreement([0.8, 0, 0])).toBe(1);
  });

  it("still detects genuine conflict between sources that spoke", () => {
    // A strong resume claim alongside a weak interview showing IS conflict,
    // and must remain visible — this is the mechanism's whole point.
    expect(computeAgreement([1, 0.1])).toBeLessThan(0.3);
  });

  it("reports full agreement when sources concur", () => {
    expect(computeAgreement([0.9, 0.9, 0.9])).toBeCloseTo(1, 5);
  });
});

describe("coverage carries the sparse-evidence penalty", () => {
  const mod = (weight: number, discountedEvidence: number) => ({ weight, discountedEvidence });

  it("is zero when nothing spoke and one when everything did", () => {
    expect(computeCoverage([mod(0.5, 0), mod(0.5, 0)])).toBe(0);
    expect(computeCoverage([mod(0.5, 1), mod(0.5, 1)])).toBe(1);
  });

  it("rises as more of the evidence base contributes", () => {
    const sparse = computeCoverage([mod(0.25, 1), mod(0.25, 0), mod(0.25, 0), mod(0.25, 0)]);
    const broad = computeCoverage([mod(0.25, 1), mod(0.25, 1), mod(0.25, 1), mod(0.25, 0)]);
    expect(broad).toBeGreaterThan(sparse);
  });
});

describe("behavioural reliability", () => {
  it("does not penalise a user for having no rating history", () => {
    // A 0.5 prior capped confidence at 0.5 for anyone who had rated a
    // skill once — penalising them for the sparseness of our data rather
    // than for anything about their skill.
    expect(computeBehavioralReliabilityIndex([3])).toBe(1);
    expect(computeBehavioralReliabilityIndex([])).toBe(1);
  });

  it("rewards a stable self-rating and discounts a volatile one", () => {
    expect(computeBehavioralReliabilityIndex([4, 4, 4])).toBe(1);
    expect(computeBehavioralReliabilityIndex([1, 5, 1, 5])).toBeLessThan(0.5);
  });

  it("lets a well-evidenced skill reach High confidence", () => {
    const strong = computeSkillConfidence(base({
      selfRating: 4,
      ratingHistory: [4, 4, 4],
      careerGoal: "data_analyst" as any,
      profileSkills: ["Power BI", "SQL", "Tableau"],
      experience: [{
        title: "Data Analyst",
        description: "Built Power BI dashboards with SQL and Excel for reporting",
        current: true,
      }],
      interviewEvidence: [{ density: 0.9, answeredAt: new Date().toISOString() }],
      learningEvidence: [{ engagedAt: new Date().toISOString() }, { engagedAt: new Date().toISOString() }],
      certificates: [VERIFIED_POWERBI],
    }));
    expect(strong.confidenceState).toBe("High");
  });
});

describe("career goal is context, not evidence", () => {
  it("cannot corroborate or contradict a claim of possession", () => {
    // Career goal says a skill MATTERS to the user, not that they have
    // it — so it must not move Agreement, which measures whether the
    // sources claiming possession concur.
    const onPath = computeSkillConfidence(base({
      careerGoal: "data_analyst" as any,
      certificates: [VERIFIED_POWERBI],
    }));
    const offPath = computeSkillConfidence(base({
      careerGoal: "cybersecurity" as any,
      certificates: [VERIFIED_POWERBI],
    }));
    expect(onPath.breakdown.agreement).toBe(offPath.breakdown.agreement);
  });
});

describe("disagreement remains visible", () => {
  it("scores a contradicted claim below a merely unevidenced one", () => {
    const contradicted = computeSkillConfidence(base({
      selfRating: 5,
      profileSkills: ["Power BI"],
      experience: [{ title: "Analyst", description: "Power BI reporting", current: true }],
      interviewEvidence: [{ density: 0.05, answeredAt: new Date().toISOString() }],
    }));
    // Resume says strong, interview says nearly nothing — that conflict
    // must surface as low agreement rather than averaging out.
    expect(contradicted.breakdown.agreement).toBeLessThan(0.5);
  });
});
