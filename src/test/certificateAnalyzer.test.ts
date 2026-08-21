import { describe, it, expect } from "vitest";
import { analyzeCertificates } from "@/lib/amsce/certificateAnalyzer";
import { CertificateEvidence } from "@/lib/certificates/certificateEvidence";

const cert = (over: Partial<CertificateEvidence> = {}): CertificateEvidence => ({
  name: "Analysis and Visualization of Data with Power BI",
  issuer: "Coursera",
  issueDate: "2026-01",
  expiryDate: "",
  trustLevel: "verified",
  ...over,
});

const POWERBI = ["powerbi"];

describe("certificate → skill matching", () => {
  it("matches a certificate to the skill named in its title", () => {
    const r = analyzeCertificates([cert()], POWERBI);
    expect(r.value).toBe(1);
    expect(r.matchedName).toContain("Power BI");
  });

  it("ignores a certificate about an unrelated skill", () => {
    const r = analyzeCertificates([cert({ name: "Introduction to Cybersecurity" })], POWERBI);
    expect(r.value).toBe(0);
    expect(r.trustLevel).toBeNull();
  });

  it("reads the issue date as the evidence timestamp", () => {
    const r = analyzeCertificates([cert()], POWERBI);
    expect(r.timestamp).toBe("2026-01-15");
  });

  it("tolerates a missing issue date rather than inventing one", () => {
    const r = analyzeCertificates([cert({ issueDate: "" })], POWERBI);
    expect(r.value).toBe(1);
    expect(r.timestamp).toBeNull();
  });
});

describe("trust level drives evidence strength", () => {
  it("ranks the trust levels in the intended order", () => {
    const strength = (trustLevel: CertificateEvidence["trustLevel"]) =>
      analyzeCertificates([cert({ trustLevel })], POWERBI).value;

    expect(strength("verified")).toBeGreaterThan(strength("corroborated"));
    expect(strength("corroborated")).toBeGreaterThan(strength("self_reported"));
    expect(strength("self_reported")).toBeGreaterThan(strength("disputed"));
  });

  it("gives a disputed certificate no weight at all", () => {
    expect(analyzeCertificates([cert({ trustLevel: "disputed" })], POWERBI).value).toBe(0);
  });

  it("keeps a wide gap between confirmed and merely claimed", () => {
    // If an unbacked claim scored close to a confirmed one, the entire
    // verification pipeline would be decorative.
    const verified = analyzeCertificates([cert({ trustLevel: "verified" })], POWERBI).value;
    const claimed = analyzeCertificates([cert({ trustLevel: "self_reported" })], POWERBI).value;
    expect(verified - claimed).toBeGreaterThanOrEqual(0.5);
  });
});

describe("expiry handling", () => {
  it("discounts a lapsed certificate without discarding it", () => {
    const live = analyzeCertificates([cert({ expiryDate: "2099-01" })], POWERBI);
    const lapsed = analyzeCertificates([cert({ expiryDate: "2020-01" })], POWERBI);

    expect(lapsed.expired).toBe(true);
    expect(lapsed.value).toBeGreaterThan(0);        // still evidences past skill
    expect(lapsed.value).toBeLessThan(live.value);  // but shouldn't read as current
  });

  it("treats a blank expiry as non-expiring", () => {
    expect(analyzeCertificates([cert({ expiryDate: "" })], POWERBI).expired).toBe(false);
  });
});

describe("multiple certificates", () => {
  it("takes the strongest match rather than summing them", () => {
    // Three overlapping certificates are not three times the evidence,
    // and accumulating would reward padding a profile over being verified.
    const r = analyzeCertificates([
      cert({ trustLevel: "self_reported" }),
      cert({ trustLevel: "verified" }),
      cert({ trustLevel: "corroborated" }),
    ], POWERBI);

    expect(r.value).toBe(1);
    expect(r.trustLevel).toBe("verified");
  });

  it("never exceeds 1 no matter how many certificates match", () => {
    const many = Array.from({ length: 8 }, () => cert());
    expect(analyzeCertificates(many, POWERBI).value).toBeLessThanOrEqual(1);
  });

  it("returns empty evidence for an empty list", () => {
    const r = analyzeCertificates([], POWERBI);
    expect(r.value).toBe(0);
    expect(r.matchedName).toBeNull();
  });
});
