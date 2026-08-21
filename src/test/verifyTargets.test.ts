import { describe, it, expect } from "vitest";
import { CERTIFICATE_ISSUERS, getIssuer } from "@/data/certificateIssuers";
import { VERIFY_TARGETS, classify, VerifyTarget } from "../../api/verify-certificate";

// The client registry and the serverless verifier are deliberately
// separate files — api/verify-certificate.ts must run with no
// cross-directory imports, because an extensionless ESM import across
// directories crashed it at runtime on Vercel. These tests are what stop
// that separation from drifting into two disagreeing sources of truth.

describe("client registry ↔ server verify targets", () => {
  it("agrees on exactly which issuers support automatic verification", () => {
    const clientSays = CERTIFICATE_ISSUERS
      .filter(i => i.supportsAutoVerify)
      .map(i => i.key)
      .sort();
    const serverSays = Object.keys(VERIFY_TARGETS).sort();
    expect(clientSays).toEqual(serverSays);
  });

  it("gives every manual-only issuer a reason to show the user", () => {
    for (const issuer of CERTIFICATE_ISSUERS) {
      if (!issuer.supportsAutoVerify) {
        expect(issuer.manualOnlyReason, `${issuer.key} needs a manualOnlyReason`).toBeTruthy();
      }
    }
  });

  it("uses the same credential format on both sides", () => {
    // A server-side format stricter than the client's would reject
    // credentials the UI accepted, producing a bogus "invalid".
    for (const [key, target] of Object.entries(VERIFY_TARGETS)) {
      const client = getIssuer(key);
      expect(client, `${key} missing from client registry`).toBeTruthy();
      expect(String(target.idFormat), `${key} format mismatch`).toBe(String(client!.idFormat));
    }
  });

  it("only ever fetches over https, with the credential encoded", () => {
    for (const [key, target] of Object.entries(VERIFY_TARGETS)) {
      expect(target.fetchUrl("TEST123").startsWith("https://"), key).toBe(true);
      const escaped = target.fetchUrl("../../evil?x=1");
      expect(escaped, key).not.toContain("../..");
      expect(new URL(escaped).hostname, key).not.toBe("evil");
    }
  });

  it("never uses a stateful global regex", () => {
    for (const target of Object.values(VERIFY_TARGETS)) {
      if (target.idFormat) expect(target.idFormat.global).toBe(false);
      for (const p of [...(target.validPatterns ?? []), ...(target.notFoundPatterns ?? [])]) {
        expect(p.global).toBe(false);
      }
    }
  });
});

describe("classification safety rules", () => {
  const coursera = VERIFY_TARGETS["Coursera"];
  const REAL_META = `<meta property="og:title" content="Completion Certificate for Analysis and Visualization of Data with Power BI"/>`;
  const BOGUS_META = `<meta property="og:title" content="Coursera | Online Courses &amp; Credentials From Top Educators. Join for Free"/>`;

  it("confirms a real Coursera credential from its meta tags", () => {
    expect(classify(200, REAL_META, coursera).status).toBe("verified");
  });

  it("denies the generic Coursera not-found shell", () => {
    expect(classify(200, BOGUS_META, coursera).status).toBe("invalid");
  });

  it("lets positive confirmation win over a not-found marker", () => {
    // If Coursera changes its layout so both patterns match, a real
    // certificate must not start being reported as fake.
    expect(classify(200, REAL_META + BOGUS_META, coursera).status).toBe("verified");
  });

  it("treats a bot challenge as unreachable, never invalid", () => {
    const challenge = "<title>Just a moment...</title>";
    expect(classify(403, challenge, coursera).status).toBe("unreachable");
    expect(classify(200, challenge, coursera).status).toBe("unreachable");
  });

  it("treats rate limiting and issuer outages as unreachable", () => {
    expect(classify(429, "", coursera).status).toBe("unreachable");
    expect(classify(503, "", coursera).status).toBe("unreachable");
  });

  it("falls back to inconclusive when nothing is recognisable", () => {
    expect(classify(200, "<html>something else entirely</html>", coursera).status).toBe("inconclusive");
  });

  it("does not trust a 404 from an issuer that 200s on unknown credentials", () => {
    const credly: VerifyTarget = VERIFY_TARGETS["IBM"];
    expect(credly.trusts404).toBe(false);
    // No og:title present and no not-found marker configured.
    expect(classify(200, "<html>no og title here</html>", credly).status).toBe("inconclusive");
  });
});
