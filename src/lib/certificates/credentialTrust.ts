// Combines the two independent signals we hold about a certificate —
// what the issuer says, and what the uploaded document says — into a
// single trust level.
//
// The ordering rule is that a CONTRADICTION always outranks corroboration.
// An issuer saying "no such credential" is decisive regardless of how
// convincing the uploaded PDF looks, because the issuer is the authority
// and the PDF is not.
//
// Note the deliberate gap between `verified` and `corroborated`. Only an
// issuer can put a credential in `verified`. A document, however
// consistent, can never promote itself past `corroborated` — it is
// evidence the user holds a plausible certificate, not proof the
// certificate is real.

import { VerificationStatus } from "./verifyCertificate";
import { DocumentConsistency } from "./certificateDocument";

export type TrustLevel =
  | "verified"      // the issuer confirmed it
  | "corroborated"  // document is internally consistent; issuer couldn't be asked
  | "self_reported" // nothing beyond a well-formed claim
  | "disputed";     // the issuer denied it, or the document contradicts the claim

export interface TrustAssessment {
  level: TrustLevel;
  label: string;
  detail: string;
}

export function assessCredentialTrust(
  verification: VerificationStatus | null,
  document: DocumentConsistency | null,
): TrustAssessment {
  // 1. The issuer's denial is decisive.
  if (verification === "invalid") {
    return {
      level: "disputed",
      label: "Disputed",
      detail: "The issuer has no record of this credential.",
    };
  }

  // 2. A document that contradicts the claim is also decisive — this is
  //    the "you uploaded a certificate showing a different ID" case.
  if (document === "weak") {
    return {
      level: "disputed",
      label: "Doesn't match",
      detail: "The uploaded certificate doesn't support the details entered.",
    };
  }

  // 3. Only the issuer can grant full verification.
  if (verification === "verified") {
    return {
      level: "verified",
      label: "Verified",
      detail: "Confirmed directly with the issuer.",
    };
  }

  // 4. A consistent document is the best available signal for issuers we
  //    cannot query. It is explicitly not "verified".
  if (document === "strong") {
    return {
      level: "corroborated",
      label: "Document checked",
      detail:
        "The uploaded certificate is consistent with these details. " +
        "This isn't issuer confirmation — use the manual link to be certain.",
    };
  }

  if (document === "partial") {
    return {
      level: "self_reported",
      label: "Partly checked",
      detail: "Some details on the uploaded certificate matched, but not enough to corroborate it.",
    };
  }

  return {
    level: "self_reported",
    label: "Self-reported",
    detail: "Nothing beyond the details entered. Upload the certificate to strengthen it.",
  };
}
