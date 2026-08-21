// AMSCE — Adaptive Confidence Engine (Phase 3)
//
// The orchestrator: combines every evidence module's output into a single
// calibrated skill score, an explicit confidence score/state, and a
// human-readable explainability breakdown. Fully deterministic — every
// intermediate value is named and traceable back to its source, by
// design (see the AMSCE invention disclosure's design-philosophy
// rationale: explainability, bias-risk mitigation, and Indian Section
// 3(k) practice all favor a describable mechanism over an opaque model).

import { CareerPathKey } from "@/data/careerPaths";
import { getSkillEcosystem } from "@/data/skillEcosystems";
import { resolveSkillVocabTerms } from "@/data/skillLabelMap";
import { analyzeResumeContext, ExperienceEntry, ProjectEntry } from "./resumeContextAnalyzer";
import { analyzeCareerGoalAlignment } from "./careerGoalAnalyzer";
import { analyzeCertificates } from "./certificateAnalyzer";
import { CertificateEvidence } from "@/lib/certificates/certificateEvidence";
import { freshnessDiscount, HALF_LIFE_MONTHS } from "./evidenceNormalizer";
import { computeAgreement, computeBehavioralReliabilityIndex, computeSkillDepthScore } from "./crossModalConsistency";

export type ConfidenceState = "Low" | "Medium" | "High";

export interface InterviewEvidenceInput { density: number; answeredAt: string }
export interface LearningEvidenceInput { engagedAt: string }

export interface ComputeConfidenceParams {
  skillLabel: string;
  selfRating: number;
  ratingHistory: number[];
  careerGoal: CareerPathKey | null;
  profileSkills: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  interviewEvidence: InterviewEvidenceInput[];
  learningEvidence: LearningEvidenceInput[];
  certificates: CertificateEvidence[];
}

export interface EvidenceModuleSummary {
  name: string;
  weight: number;
  rawEvidence: number;
  discountedEvidence: number;
  timestamp: string | null;
}

export interface SkillConfidenceResult {
  skill: string;
  skillScore: number;
  confidenceScore: number;
  confidenceState: ConfidenceState;
  explainability: string[];
  breakdown: {
    selfRating: number;
    agreement: number;
    bri: number;
    sds: number;
    rawEvidenceStrength: number;
    modules: EvidenceModuleSummary[];
  };
}

// Five modules now. Certificates take a meaningful share because they are
// the only source carrying third-party confirmation; resume and interview
// each give up 0.05 and the two weakest contextual signals give up 0.05
// each, rather than diluting every module evenly.
const WEIGHTS = {
  resume: 0.25,
  interview: 0.25,
  certificate: 0.20,
  careerGoal: 0.15,
  learning: 0.15,
};

export function computeSkillConfidence(params: ComputeConfidenceParams): SkillConfidenceResult {
  const {
    skillLabel, selfRating, ratingHistory, careerGoal,
    profileSkills, experience, projects, interviewEvidence, learningEvidence,
    certificates,
  } = params;

  const vocabTerms = resolveSkillVocabTerms(skillLabel);

  // ── Evidence collection ──────────────────────────────────────────────
  const resume = analyzeResumeContext(vocabTerms, profileSkills, experience, projects);
  const careerGoalScore = analyzeCareerGoalAlignment(vocabTerms, careerGoal);

  const bestInterview = interviewEvidence.reduce<InterviewEvidenceInput | null>(
    (best, cur) => (!best || cur.density > best.density ? cur : best), null,
  );
  const interviewRaw = bestInterview?.density ?? 0;
  const interviewTimestamp = bestInterview?.answeredAt ?? null;

  const learningCount = learningEvidence.length;
  const learningRaw = learningCount >= 2 ? 1.0 : learningCount === 1 ? 0.5 : 0;
  const learningTimestamp = learningEvidence
    .map(e => e.engagedAt)
    .sort()
    .at(-1) ?? null;

  const certificate = analyzeCertificates(certificates ?? [], vocabTerms);

  // ── Freshness discounting ────────────────────────────────────────────
  const modules: EvidenceModuleSummary[] = [
    {
      name: "Resume / Projects", weight: WEIGHTS.resume,
      rawEvidence: resume.presence, timestamp: resume.timestamp,
      discountedEvidence: freshnessDiscount(resume.presence, resume.timestamp, HALF_LIFE_MONTHS.resume),
    },
    {
      name: "Mock Interview", weight: WEIGHTS.interview,
      rawEvidence: interviewRaw, timestamp: interviewTimestamp,
      discountedEvidence: freshnessDiscount(interviewRaw, interviewTimestamp, HALF_LIFE_MONTHS.interview),
    },
    {
      name: "Certificates", weight: WEIGHTS.certificate,
      rawEvidence: certificate.value, timestamp: certificate.timestamp,
      discountedEvidence: freshnessDiscount(certificate.value, certificate.timestamp, HALF_LIFE_MONTHS.certificate),
    },
    {
      name: "Career Goal Alignment", weight: WEIGHTS.careerGoal,
      rawEvidence: careerGoalScore, timestamp: null,
      discountedEvidence: careerGoalScore, // always current — no decay
    },
    {
      name: "Learning Activity", weight: WEIGHTS.learning,
      rawEvidence: learningRaw, timestamp: learningTimestamp,
      discountedEvidence: freshnessDiscount(learningRaw, learningTimestamp, HALF_LIFE_MONTHS.learning),
    },
  ];

  // ── Cross-modal consistency ──────────────────────────────────────────
  const agreement = computeAgreement(modules.map(m => m.discountedEvidence));
  const bri = computeBehavioralReliabilityIndex(ratingHistory);

  const avgExpectedBreadth =
    vocabTerms.reduce((sum, t) => sum + getSkillEcosystem(t).expected, 0) / vocabTerms.length;
  const sds = computeSkillDepthScore(resume.depthMatches, avgExpectedBreadth);

  // ── Adaptive confidence + calibration ────────────────────────────────
  const rawEvidenceStrength = modules.reduce((sum, m) => sum + m.weight * m.discountedEvidence, 0);
  const confidenceScore = agreement * bri * (0.7 + 0.3 * sds);
  const skillScore = selfRating + confidenceScore * (rawEvidenceStrength * 4 + 1 - selfRating);

  const confidenceState: ConfidenceState =
    confidenceScore >= 0.7 ? "High" : confidenceScore >= 0.4 ? "Medium" : "Low";

  // ── Explainability ────────────────────────────────────────────────────
  const explainability: string[] = [];

  if (resume.presence === 1.0) explainability.push("✓ Mentioned in your Experience or Projects");
  else if (resume.presence === 0.4) explainability.push("○ Only listed in your skills list — not in Experience or Projects");
  else explainability.push("⚠ Not found anywhere in your profile");

  if (interviewRaw > 0) explainability.push(`✓ Demonstrated in a Mock Interview answer`);
  else explainability.push("○ Not yet demonstrated in a Mock Interview answer");

  if (certificate.trustLevel === "verified") {
    explainability.push(
      `✓ Backed by "${certificate.matchedName}", confirmed with the issuer` +
      (certificate.expired ? " (now expired)" : ""),
    );
  } else if (certificate.trustLevel === "corroborated") {
    explainability.push(`✓ Backed by "${certificate.matchedName}" — document checked, not issuer-confirmed`);
  } else if (certificate.trustLevel === "self_reported") {
    explainability.push(`○ "${certificate.matchedName}" listed, but nothing independently backs it yet`);
  } else if (certificate.trustLevel === "disputed") {
    explainability.push(`⚠ "${certificate.matchedName}" could not be substantiated — it adds nothing here`);
  } else {
    explainability.push("○ No certificate covering this skill");
  }

  if (careerGoalScore === 1.0) explainability.push("✓ Core skill for your selected career path");
  else if (careerGoalScore === 0.3) explainability.push("○ Relevant to a different career path than your current goal");

  if (learningCount >= 1) explainability.push(`✓ Engaged with ${learningCount} related learning resource${learningCount > 1 ? "s" : ""}`);
  else explainability.push("○ No related learning resources opened yet");

  if (ratingHistory.length < 2) explainability.push("— Not enough rating history yet to assess consistency");
  else if (bri >= 0.8) explainability.push("✓ Your self-rating has been consistent over time");
  else if (bri < 0.5) explainability.push("⚠ Your self-rating has varied significantly over time");

  if (sds > 0) explainability.push("✓ Backed by specific, related technical detail");

  return {
    skill: skillLabel,
    skillScore: Math.round(skillScore * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    confidenceState,
    explainability,
    breakdown: { selfRating, agreement, bri, sds, rawEvidenceStrength, modules },
  };
}
