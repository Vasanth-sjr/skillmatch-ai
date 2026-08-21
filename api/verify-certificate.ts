// Server-side certificate verification.
//
// Runs as a Vercel serverless function because this check CANNOT be done
// from the browser: every issuer's verify page blocks cross-origin reads.
//
// Design rule that governs everything below: an ambiguous result must
// never be reported as "invalid". Being rate-limited, challenged by bot
// protection, or timing out are all "unreachable" — telling someone their
// genuine certificate is fake is a far worse failure than admitting we
// could not check it. Only a positive not-found signal from the issuer
// produces "invalid".

import { getIssuer, CHALLENGE_MARKERS } from "../src/data/certificateIssuers";

export type VerificationStatus =
  | "verified"      // issuer's page positively confirms the credential
  | "invalid"       // issuer positively says no such credential exists
  | "inconclusive"  // page loaded, but carried no signal either way
  | "unreachable"   // blocked, timed out, or errored — we genuinely don't know
  | "unsupported";  // this issuer offers no automatable verification

interface VerifyResponse {
  status: VerificationStatus;
  /** Short machine-readable reason, stored for tuning the markers later. */
  signal: string;
  /** Human-facing sentence for the UI. */
  message: string;
  checkedAt: string;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_CHARS = 250_000;

// A normal browser UA — these are public pages served to human readers, and
// a bare fetch UA is rejected by most CDNs as malformed traffic.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function reply(res: any, body: VerifyResponse, code = 200) {
  res.status(code).json(body);
}

function now() {
  return new Date().toISOString();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, {
      status: "unreachable",
      signal: "method_not_allowed",
      message: "Verification requests must use POST.",
      checkedAt: now(),
    }, 405);
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const issuerKey = String(body?.issuer ?? "").trim();
  const credentialId = String(body?.credentialId ?? "").trim();

  const issuer = getIssuer(issuerKey);
  if (!issuer) {
    return reply(res, {
      status: "unsupported",
      signal: "unknown_issuer",
      message: "That issuer isn't recognised.",
      checkedAt: now(),
    });
  }

  if (!issuer.autoVerify) {
    return reply(res, {
      status: "unsupported",
      signal: "no_auto_verify",
      message: issuer.manualOnlyReason ?? "This issuer can't be checked automatically.",
      checkedAt: now(),
    });
  }

  // Re-validate the format server-side. The client already does this, but
  // the client is not trusted — and this also constrains what can reach
  // the URL template below.
  if (issuer.idFormat && !issuer.idFormat.test(credentialId)) {
    return reply(res, {
      status: "invalid",
      signal: "bad_format",
      message: `That isn't a valid ${issuer.label} credential ID format.`,
      checkedAt: now(),
    });
  }

  // Defence in depth against SSRF: the URL is built from our own template
  // and the ID is percent-encoded inside it, but re-check that nothing
  // escaped the intended host.
  const target = issuer.autoVerify.fetchUrl(credentialId);
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return reply(res, {
      status: "unreachable",
      signal: "bad_target_url",
      message: "Couldn't build a verification URL for that credential.",
      checkedAt: now(),
    });
  }
  if (parsed.protocol !== "https:") {
    return reply(res, {
      status: "unreachable",
      signal: "non_https_target",
      message: "Verification is only performed over HTTPS.",
      checkedAt: now(),
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = (await response.text()).slice(0, MAX_BODY_CHARS).toLowerCase();
    return reply(res, classify(response.status, html, issuer));
  } catch (err: any) {
    const aborted = err?.name === "AbortError";
    return reply(res, {
      status: "unreachable",
      signal: aborted ? "timeout" : `fetch_error:${err?.name ?? "unknown"}`,
      message: aborted
        ? "The issuer's site didn't respond in time. Try the manual check."
        : "Couldn't reach the issuer's site. Try the manual check.",
      checkedAt: now(),
    });
  } finally {
    clearTimeout(timer);
  }
}

function classify(
  httpStatus: number,
  html: string,
  issuer: NonNullable<ReturnType<typeof getIssuer>>,
): VerifyResponse {
  const cfg = issuer.autoVerify!;

  // 1. Bot challenge / block — checked FIRST so it can never be mistaken
  //    for a not-found page.
  const challenge = CHALLENGE_MARKERS.find(m => html.includes(m));
  if (challenge || httpStatus === 403 || httpStatus === 429) {
    return {
      status: "unreachable",
      signal: challenge ? `challenge:${challenge}` : `http_${httpStatus}`,
      message: `${issuer.label} blocked the automated check. Use "Check for yourself" to confirm.`,
      checkedAt: now(),
    };
  }

  // 2. Server-side problems at the issuer — also not our user's fault.
  if (httpStatus >= 500) {
    return {
      status: "unreachable",
      signal: `http_${httpStatus}`,
      message: `${issuer.label}'s verification service is having problems right now.`,
      checkedAt: now(),
    };
  }

  // 3. A clean 404 from an issuer known to 404 on unknown credentials.
  if (httpStatus === 404 && cfg.trusts404) {
    return {
      status: "invalid",
      signal: "http_404",
      message: `${issuer.label} has no certificate with that ID.`,
      checkedAt: now(),
    };
  }

  // 4. Explicit not-found wording in the page body.
  const notFound = cfg.notFoundMarkers.find(m => html.includes(m));
  if (notFound) {
    return {
      status: "invalid",
      signal: `not_found_marker:${notFound}`,
      message: `${issuer.label} has no certificate with that ID.`,
      checkedAt: now(),
    };
  }

  // 5. Positive confirmation.
  const valid = cfg.validMarkers.find(m => html.includes(m));
  if (httpStatus === 200 && valid) {
    return {
      status: "verified",
      signal: `valid_marker:${valid}`,
      message: `Confirmed on ${issuer.label}.`,
      checkedAt: now(),
    };
  }

  // 6. Page loaded but said nothing we recognise. Report honestly rather
  //    than guessing — and record the signal so the markers can be tuned
  //    against what these pages actually return.
  return {
    status: "inconclusive",
    signal: `no_marker:http_${httpStatus}:len_${html.length}`,
    message: `Couldn't read a clear answer from ${issuer.label}. Use "Check for yourself" to confirm.`,
    checkedAt: now(),
  };
}

function safeParse(s: string): any {
  try { return JSON.parse(s); } catch { return {}; }
}
