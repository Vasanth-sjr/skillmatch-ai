import { describe, it, expect } from "vitest";
import { textEvidencesTerm, canonicalTermsIn, vocabTermFoundIn } from "@/lib/skillVocabulary";
import { resolveSkillVocabTerms } from "@/data/skillLabelMap";
import { analyzeResumeContext } from "@/lib/amsce/resumeContextAnalyzer";

// REGRESSION: skillLabelMap compacts "Power BI" to "powerbi", but people
// write "Power BI" with a space. A token-boundary search for the compact
// form never matched the spaced one, so the Resume Context Analyzer
// silently failed on EVERY multi-word skill — a large share of the
// catalogue. The symptom was "Not found anywhere in your profile" for a
// skill that was plainly there.

const MULTIWORD_LABELS = [
  "Power BI",
  "System Design",
  "REST API Design",
  "Machine Learning",
  "Deep Learning",
];

describe("multi-word skill matching", () => {
  it("demonstrates the raw matcher's blind spot", () => {
    // Kept explicit so the reason textEvidencesTerm exists stays visible.
    expect(vocabTermFoundIn("Power BI", "powerbi")).toBe(false);
  });

  it("matches a skill written with spaces against its compact form", () => {
    expect(textEvidencesTerm("Built Power BI dashboards", "powerbi")).toBe(true);
    expect(textEvidencesTerm("Led System Design reviews", "systemdesign")).toBe(true);
  });

  it("resolves every multi-word label against its own text", () => {
    for (const label of MULTIWORD_LABELS) {
      const terms = resolveSkillVocabTerms(label);
      const found = terms.some(t => textEvidencesTerm(label, t));
      expect(found, `"${label}" should match its own label text`).toBe(true);
    }
  });

  it("still refuses genuinely absent skills", () => {
    expect(textEvidencesTerm("Built React dashboards", "powerbi")).toBe(false);
    expect(textEvidencesTerm("", "powerbi")).toBe(false);
  });

  it("does not match a term inside an unrelated longer word", () => {
    // "go" must not match "google" or "algorithm".
    expect(textEvidencesTerm("Studied algorithms at Google", "go")).toBe(false);
  });

  it("canonicalises spaced vocabulary into compact terms", () => {
    const terms = canonicalTermsIn("Power BI and SQL reporting");
    expect(terms.has("powerbi")).toBe(true);
    expect(terms.has("sql")).toBe(true);
  });
});

describe("resume context analysis with multi-word skills", () => {
  it("finds a multi-word skill in experience text", () => {
    const r = analyzeResumeContext(
      resolveSkillVocabTerms("Power BI"),
      [],
      [{ title: "Data Analyst", description: "Built Power BI dashboards", current: true }],
      [],
    );
    expect(r.presence).toBe(1.0);
  });

  it("distinguishes a bare skills-list mention from demonstrated context", () => {
    const listed = analyzeResumeContext(resolveSkillVocabTerms("Power BI"), ["Power BI"], [], []);
    const demonstrated = analyzeResumeContext(
      resolveSkillVocabTerms("Power BI"), ["Power BI"],
      [{ title: "Analyst", description: "Power BI reporting", current: true }], [],
    );
    expect(listed.presence).toBe(0.4);
    expect(demonstrated.presence).toBe(1.0);
    expect(demonstrated.presence).toBeGreaterThan(listed.presence);
  });

  it("reports absence honestly", () => {
    const r = analyzeResumeContext(
      resolveSkillVocabTerms("Power BI"), ["React"],
      [{ title: "Frontend Dev", description: "React and TypeScript", current: true }], [],
    );
    expect(r.presence).toBe(0);
  });
});

// Labels with no clean vocabulary equivalent. Evidence modules honestly
// score these zero, and the self-rating stays the primary signal — which
// is correct for judgement-based skills that leave no textual trace the
// way "React" or "Docker" do.
//
// The list is explicit so the gap stays DECLARED rather than accidental.
// An audit found 44 labels silently unmatchable; 28 were real oversights
// and were fixed by extending the vocabulary. These 16 are the genuine
// remainder. Adding a new unmatched mapping fails the test below, which
// forces the choice — extend the vocabulary, or record it here — instead
// of letting a skill quietly score zero forever.
const NO_VOCABULARY_EQUIVALENT = new Set([
  "Testing (Jest/RTL)", "Browser DevTools", "Layout & Spacing",
  "Stakeholder Comms", "Design Critique", "Presentation",
  "Stakeholder Reporting", "Roadmapping", "OKRs & Goal Setting",
  "Analytics Tools", "Data-driven Decisions", "Stakeholder Mgmt",
  "Eng Partnership", "Go-to-Market Planning", "Deployment Strategies",
  "Play Store Deploy",
]);

describe("skill label map coverage", () => {
  it("maps every skill to a real vocabulary term, or declares why not", async () => {
    const { SKILL_LABEL_TO_VOCAB } = await import("@/data/skillLabelMap");
    const { VOCAB, canonical } = await import("@/lib/skillVocabulary");
    const vocab = new Set(VOCAB.map(canonical));

    const undeclared = Object.entries(SKILL_LABEL_TO_VOCAB)
      .filter(([label, terms]) =>
        !NO_VOCABULARY_EQUIVALENT.has(label) &&
        !terms.some(t => vocab.has(canonical(t))));

    expect(undeclared.map(([l]) => l), "unmatchable skills must be fixed or declared").toEqual([]);
  });

  it("does not declare exemptions for skills that actually resolve", async () => {
    // Keeps the allowlist honest as the vocabulary grows.
    const { SKILL_LABEL_TO_VOCAB } = await import("@/data/skillLabelMap");
    const { VOCAB, canonical } = await import("@/lib/skillVocabulary");
    const vocab = new Set(VOCAB.map(canonical));

    const stale = [...NO_VOCABULARY_EQUIVALENT].filter(label => {
      const terms = SKILL_LABEL_TO_VOCAB[label];
      return terms && terms.some(t => vocab.has(canonical(t)));
    });

    expect(stale, "these now resolve and should leave the allowlist").toEqual([]);
  });
});
