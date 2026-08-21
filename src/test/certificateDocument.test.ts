import { describe, it, expect } from "vitest";
import { analyzeCertificateDocument, validateCertificateFile, MAX_CERT_FILE_BYTES } from "@/lib/certificates/certificateDocument";
import { assessCredentialTrust } from "@/lib/certificates/credentialTrust";

// Text approximating what pdfjs extracts from a real Coursera PDF.
const COURSERA_PDF = `
  Coursera
  VASANTH S J R
  has successfully completed
  Google Data Analytics Professional Certificate
  Verify at: coursera.org/verify/8ZQ3FKMHXW5T
  Course Certificate
`;

const UDEMY_PDF = `
  Udemy
  Certificate of Completion
  The Complete Web Developer Course
  Vasanth S J R
  Instructors: Rob Percival
  ude.my/UC-1a2b3c4d-5e6f-7890-abcd-ef1234567890
`;

describe("certificate document analysis", () => {
  it("extracts the credential ID from a printed verification URL", () => {
    const a = analyzeCertificateDocument(COURSERA_PDF, "Coursera", "", "Vasanth S.J.R");
    expect(a.foundIssuerUrl).toBe(true);
    expect(a.extractedCredentialId).toBe("8ZQ3FKMHXW5T");
  });

  it("handles issuers whose URL lives on a short domain", () => {
    const a = analyzeCertificateDocument(UDEMY_PDF, "Udemy", "", "Vasanth S J R");
    expect(a.extractedCredentialId).toBe("UC-1a2b3c4d-5e6f-7890-abcd-ef1234567890");
  });

  it("confirms a matching credential ID", () => {
    const a = analyzeCertificateDocument(COURSERA_PDF, "Coursera", "8ZQ3FKMHXW5T", "Vasanth S.J.R");
    expect(a.matchesEnteredId).toBe(true);
    expect(a.consistency).toBe("strong");
  });

  it("flags a certificate whose printed ID contradicts what was entered", () => {
    const a = analyzeCertificateDocument(COURSERA_PDF, "Coursera", "AAAAAAAAAAAA", "Vasanth S.J.R");
    expect(a.matchesEnteredId).toBe(false);
    // A contradiction must outrank every other passing check.
    expect(a.consistency).toBe("weak");
  });

  it("matches names across punctuation and spacing differences", () => {
    // Certificate prints "VASANTH S J R"; profile says "Vasanth S.J.R".
    const a = analyzeCertificateDocument(COURSERA_PDF, "Coursera", "8ZQ3FKMHXW5T", "Vasanth S.J.R");
    expect(a.holderNameMatches).toBe(true);
  });

  it("notices when the name on the certificate isn't the profile's", () => {
    const a = analyzeCertificateDocument(COURSERA_PDF, "Coursera", "8ZQ3FKMHXW5T", "Priya Sharma");
    expect(a.holderNameMatches).toBe(false);
  });

  it("reports unreadable rather than guessing when there's no text", () => {
    const a = analyzeCertificateDocument("", "Coursera", "8ZQ3FKMHXW5T", "Vasanth S.J.R");
    expect(a.consistency).toBe("unreadable");
    expect(a.readable).toBe(false);
  });

  it("doesn't credit an issuer URL belonging to a different provider", () => {
    // A Udemy URL on a document the user labelled as Coursera.
    const a = analyzeCertificateDocument(UDEMY_PDF, "Coursera", "", "Vasanth S J R");
    expect(a.foundIssuerUrl).toBe(false);
    expect(a.extractedCredentialId).toBeNull();
  });
});

describe("file guards", () => {
  const fakeFile = (size: number, type: string) =>
    ({ size, type, name: "c.pdf" }) as File;

  it("rejects oversized files", () => {
    expect(validateCertificateFile(fakeFile(MAX_CERT_FILE_BYTES + 1, "application/pdf"))).toContain("limit");
  });

  it("rejects unsupported types", () => {
    expect(validateCertificateFile(fakeFile(1000, "application/zip"))).toBeTruthy();
  });

  it("accepts a normal PDF", () => {
    expect(validateCertificateFile(fakeFile(500_000, "application/pdf"))).toBeNull();
  });
});

describe("combined trust assessment", () => {
  it("lets the issuer's denial override a convincing document", () => {
    // The whole point: a PDF cannot outrank the authority that issued it.
    expect(assessCredentialTrust("invalid", "strong").level).toBe("disputed");
  });

  it("never promotes a document past corroborated", () => {
    const t = assessCredentialTrust("unsupported", "strong");
    expect(t.level).toBe("corroborated");
    expect(t.level).not.toBe("verified");
  });

  it("reserves verified for issuer confirmation", () => {
    expect(assessCredentialTrust("verified", null).level).toBe("verified");
  });

  it("treats a contradicting document as disputed", () => {
    expect(assessCredentialTrust("unsupported", "weak").level).toBe("disputed");
  });

  it("falls back to self-reported with no signals at all", () => {
    expect(assessCredentialTrust(null, null).level).toBe("self_reported");
  });

  it("does not let an unreachable check imply doubt", () => {
    // "We couldn't ask" must not read as "suspicious".
    expect(assessCredentialTrust("unreachable", null).level).toBe("self_reported");
    expect(assessCredentialTrust("unreachable", "strong").level).toBe("corroborated");
  });
});
