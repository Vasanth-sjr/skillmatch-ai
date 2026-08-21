// Instant, offline format validation for a claimed credential ID.
//
// This runs as the user types. It cannot tell you a certificate is real —
// only that the code is or isn't shaped like one that issuer produces.
// A passing format check is a precondition for the live server-side
// verification, never a substitute for it.

import { getIssuer } from "@/data/certificateIssuers";

export type FormatStatus = "ok" | "empty" | "bad_format" | "unknown_issuer";

export interface FormatCheck {
  status: FormatStatus;
  message: string;
  /** Whether it's worth attempting a live verification with this input. */
  canAttemptLiveCheck: boolean;
}

export function checkCredentialFormat(issuerKey: string, rawId: string): FormatCheck {
  const id = rawId.trim();

  if (!id) {
    return { status: "empty", message: "", canAttemptLiveCheck: false };
  }

  const issuer = getIssuer(issuerKey);
  if (!issuer) {
    return {
      status: "unknown_issuer",
      message: "Select an issuing organization first",
      canAttemptLiveCheck: false,
    };
  }

  // Issuers with no meaningful public credential format (e.g. LinkedIn
  // Learning) are accepted as-is rather than judged against a pattern we
  // would only be inventing.
  if (!issuer.idFormat) {
    return {
      status: "ok",
      message: "",
      canAttemptLiveCheck: Boolean(issuer.autoVerify),
    };
  }

  if (!issuer.idFormat.test(id)) {
    return {
      status: "bad_format",
      message: issuer.formatHint || `That doesn't look like a ${issuer.label} credential ID`,
      canAttemptLiveCheck: false,
    };
  }

  return {
    status: "ok",
    message: "",
    canAttemptLiveCheck: Boolean(issuer.autoVerify),
  };
}

/** The official page a human can open to confirm the credential themselves. */
export function manualVerifyUrl(issuerKey: string, rawId: string): string | null {
  const issuer = getIssuer(issuerKey);
  if (!issuer?.verifyUrl) return null;
  return issuer.verifyUrl(rawId.trim());
}
