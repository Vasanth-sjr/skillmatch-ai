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
  it("only claims auto-verification where behaviour was actually measured", () => {
    // These were probed against live endpoints and found to be either
    // client-rendered (Coursera family), bot-blocked (Udemy), or unable
    // to distinguish fake from unshared (freeCodeCamp). Re-enabling any
    // of them requires re-probing first — see certificateIssuers.ts.
    for (const key of ["Coursera", "Google", "Meta", "Udemy", "freeCodeCamp"]) {
      expect(getIssuer(key)?.autoVerify, `${key} must stay manual-only`).toBeNull();
    }
  });

  it("gives every manual-only issuer a reason to show the user", () => {
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (!issuer.autoVerify) {
        expect(issuer.manualOnlyReason, `${issuer.key} needs a manualOnlyReason`).toBeTruthy();
      }
    }
  });

  it("never uses a stateful global regex for format checks", () => {
    // A /g regex carries lastIndex between calls and would make repeated
    // validation of the same value flap between pass and fail.
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (issuer.idFormat) expect(issuer.idFormat.global, `${issuer.key}`).toBe(false);
    }
  });

  it("only ever verifies over https", () => {
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (issuer.autoVerify) {
        expect(issuer.autoVerify.fetchUrl("TEST123").startsWith("https://")).toBe(true);
      }
      if (issuer.verifyUrl) {
        expect(issuer.verifyUrl("TEST123").startsWith("https://")).toBe(true);
      }
    }
  });

  it("percent-encodes the credential into verification URLs", () => {
    // Guards against a crafted ID escaping the intended path.
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (!issuer.autoVerify) continue;
      const url = issuer.autoVerify.fetchUrl("../../evil?x=1");
      expect(url).not.toContain("../..");
      expect(new URL(url).hostname).not.toBe("evil");
    }
  });
});
