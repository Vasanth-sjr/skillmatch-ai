import { describe, it, expect } from "vitest";
import { checkCredentialFormat, manualVerifyUrl } from "@/lib/certificates/certificateValidator";
import { getIssuer, CERTIFICATE_ISSUERS } from "@/data/certificateIssuers";

describe("credential format validation", () => {
  it("rejects obviously malformed codes", () => {
    expect(checkCredentialFormat("Coursera", "!!!nope!!!").status).toBe("bad_format");
    expect(checkCredentialFormat("Udemy", "not-a-udemy-code").status).toBe("bad_format");
    expect(checkCredentialFormat("HackerRank", "%%%%").status).toBe("bad_format");
  });

  it("accepts well-formed codes", () => {
    expect(checkCredentialFormat("Coursera", "8ZQ3FKMHXW5T").status).toBe("ok");
    expect(checkCredentialFormat("Udemy", "UC-1a2b3c4d-5e6f-7890-abcd-ef1234567890").status).toBe("ok");
    expect(checkCredentialFormat("NPTEL", "NPTEL24CS45S1234").status).toBe("ok");
  });

  it("treats empty input as neutral, not invalid", () => {
    expect(checkCredentialFormat("Coursera", "").status).toBe("empty");
    expect(checkCredentialFormat("Coursera", "   ").status).toBe("empty");
  });

  it("requires an issuer to be chosen first", () => {
    expect(checkCredentialFormat("", "ABC123").status).toBe("unknown_issuer");
  });

  it("accepts anything for issuers with no meaningful public format", () => {
    // We must not invent a pattern for issuers that don't publish one.
    expect(checkCredentialFormat("LinkedIn Learning", "whatever-shape-this-is").status).toBe("ok");
  });

  it("builds a manual verification URL that contains the credential", () => {
    const url = manualVerifyUrl("Coursera", "8ZQ3FKMHXW5T");
    expect(url).toContain("8ZQ3FKMHXW5T");
    expect(url?.startsWith("https://")).toBe(true);
  });
});

describe("issuer registry integrity", () => {
  it("keeps bot-blocked and ambiguous issuers manual-only", () => {
    // Udemy is Cloudflare-challenged; freeCodeCamp cannot distinguish a
    // fake credential from a real-but-private profile. Re-enabling either
    // requires re-probing first — see certificateIssuers.ts.
    for (const key of ["Udemy", "freeCodeCamp"]) {
      expect(getIssuer(key)?.supportsAutoVerify, `${key} must stay manual-only`).toBe(false);
    }
  });

  it("never uses a stateful global regex for format checks", () => {
    // A /g regex carries lastIndex between calls and would make repeated
    // validation of the same value flap between pass and fail.
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (issuer.idFormat) expect(issuer.idFormat.global, `${issuer.key}`).toBe(false);
    }
  });

  it("only ever links out over https", () => {
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (issuer.verifyUrl) {
        expect(issuer.verifyUrl("TEST123").startsWith("https://"), issuer.key).toBe(true);
      }
    }
  });
});
