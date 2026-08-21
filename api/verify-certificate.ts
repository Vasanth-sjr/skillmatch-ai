// Server-side certificate verification.
//
// Runs as a Vercel serverless function because this check CANNOT be done
// from the browser: every issuer's verify page blocks cross-origin reads.
//
// ── WHY THIS FILE HAS NO IMPORTS ──────────────────────────────────────
//
// It originally imported the issuer registry from ../src/data. That
// deployed fine and then failed at runtime with
// FUNCTION_INVOCATION_FAILED, because the project is "type": "module"
// and an extensionless cross-directory import isn't resolvable in ESM
// unless the platform bundles it. A serverless entrypoint that depends
// on the platform's bundling behaviour is fragile for no benefit, so the
// verification targets are declared here instead.
//
// The client registry (src/data/certificateIssuers.ts) only ever needed
// to know WHETHER an issuer supports automated verification, never how —
// it never read a fetchUrl or a marker. So the split is along a real
// seam, not a duplication: client-facing metadata there, server-side
// probing config here. src/test/verifyTargets.test.ts asserts the two
// stay in agreement.
//
// ── THE GOVERNING RULE ────────────────────────────────────────────────
//
// An ambiguous result must never be reported as "invalid". Being
// rate-limited, challenged by bot protection, or timing out are all
// "unreachable" — telling someone their genuine certificate is fake is a
// far worse failure than admitting we could not check. Only a positive
// not-found signal from the issuer produces "invalid".

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

export interface VerifyTarget {
  label: string;
  /** Permissive shape check, mirroring the client's idFormat. */
  idFormat: RegExp | null;
  fetchUrl: (id: string) => string;
  /** Lowercased substrings indicating the credential does NOT exist. */
  notFoundMarkers: string[];
  /** Lowercased substrings positively confirming a real credential. */
  validMarkers: string[];
  /** Regexes on raw html, for signals that live in a specific tag. */
  validPatterns?: RegExp[];
  notFoundPatterns?: RegExp[];
  /** True when the provider reliably 404s for unknown credentials. */
  trusts404: boolean;
}

// Markers meaning "this is a bot challenge, not an answer" — checked
// before any not-found marker so a challenge can never read as "invalid".
const CHALLENGE_MARKERS = [
  "just a moment",
  "checking your browser",
  "enable javascript and cookies",
  "cf-browser-verification",
  "captcha",
  "access denied",
  "unusual traffic",
];

// Coursera's not-found page is a 376KB marketing shell that mentions
// enough to match almost any plain substring — "power bi" hits it. Only
// the og: meta tags distinguish a real credential, hence the patterns.
const COURSERA_VALID_PATTERNS = [
  /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']*?(?:completion|specialization|professional)\s+certificate\s+for/i,
  /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']*?this certificate verifies/i,
];
const COURSERA_NOT_FOUND_PATTERNS = [
  /<meta[^>]+property=["']og:title["'][^>]+content=["']Coursera\s*(?:\||&#x7c;)/i,
];

function courseraTarget(label: string): VerifyTarget {
  return {
    label,
    idFormat: /^[A-Z0-9]{8,24}$/,
    fetchUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
    notFoundMarkers: [],
    validMarkers: [],
    validPatterns: COURSERA_VALID_PATTERNS,
    notFoundPatterns: COURSERA_NOT_FOUND_PATTERNS,
    trusts404: true,
  };
}

const CREDLY_TARGET = (label: string): VerifyTarget => ({
  label,
  idFormat: /^[A-Za-z0-9-]{6,80}$/,
  fetchUrl: id => `https://www.credly.com/badges/${encodeURIComponent(id)}`,
  // Measured: Credly returns 200 even for a nonexistent badge, so
  // trusts404 is false. A real badge page carries an og:title; a
  // nonexistent one carries none. Absence yields "inconclusive".
  notFoundMarkers: [],
  validMarkers: ['property="og:title"'],
  trusts404: false,
});

export const VERIFY_TARGETS: Record<string, VerifyTarget> = {
  // Google and Meta career certificates are issued through Coursera.
  "Coursera": courseraTarget("Coursera"),
  "Google": courseraTarget("Google Career Certificates"),
  "Meta": courseraTarget("Meta"),

  "HackerRank": {
    label: "HackerRank",
    idFormat: /^[A-Za-z0-9]{8,40}$/,
    fetchUrl: id => `https://www.hackerrank.com/certificates/${encodeURIComponent(id)}`,
    // Measured: unknown IDs return a clean 404. The body is a large SPA
    // shell either way, so trust the status code only.
    notFoundMarkers: [],
    validMarkers: ["hackerrank"],
    trusts404: true,
  },

  "edX": {
    label: "edX",
    idFormat: /^[a-f0-9]{16,64}$/i,
    fetchUrl: id => `https://courses.edx.org/certificates/${encodeURIComponent(id)}`,
    // Measured: unknown IDs return 404 with "page not found | edx".
    notFoundMarkers: ["page not found | edx"],
    validMarkers: ["successfully completed", "verified certificate"],
    trusts404: true,
  },

  "IBM": CREDLY_TARGET("IBM"),
  "Cisco": CREDLY_TARGET("Cisco"),
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_CHARS = 250_000;

// A normal browser UA — these are public pages served to human readers,
// and a bare fetch UA is rejected by most CDNs as malformed traffic.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function now() {
  return new Date().toISOString();
}

function reply(res: any, body: VerifyResponse, code = 200) {
  res.status(code).json(body);
}

function safeParse(s: string): any {
  try { return JSON.parse(s); } catch { return {}; }
}

export default async function handler(req: any, res: any) {
  try {
    return await verify(req, res);
  } catch (err: any) {
    // Never let an unexpected throw become an opaque platform 500 — the
    // client can't distinguish that from a network failure, and the user
    // just sees "didn't respond" with nothing actionable behind it.
    console.error("verify-certificate crashed:", err);
    return reply(res, {
      status: "unreachable",
      signal: `handler_error:${err?.name ?? "unknown"}:${String(err?.message ?? "").slice(0, 120)}`,
      message: "The verification service hit an error. Try the manual check.",
      checkedAt: now(),
    });
  }
}

async function verify(req: any, res: any) {
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

  const target = VERIFY_TARGETS[issuerKey];
  if (!target) {
    return reply(res, {
      status: "unsupported",
      signal: "no_auto_verify",
      message: "This issuer can't be checked automatically.",
      checkedAt: now(),
    });
  }

  // Re-validate the format server-side. The client already does this, but
  // the client is not trusted — and this also constrains what can reach
  // the URL template below.
  if (target.idFormat && !target.idFormat.test(credentialId)) {
    return reply(res, {
      status: "invalid",
      signal: "bad_format",
      message: `That isn't a valid ${target.label} credential ID format.`,
      checkedAt: now(),
    });
  }

  // Defence in depth against SSRF: the URL is built from our own template
  // and the ID is percent-encoded inside it, but re-check that nothing
  // escaped the intended host.
  let parsed: URL;
  try {
    parsed = new URL(target.fetchUrl(credentialId));
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

    const html = (await response.text()).slice(0, MAX_BODY_CHARS);
    return reply(res, classify(response.status, html, target));
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

export function classify(httpStatus: number, rawHtml: string, target: VerifyTarget): VerifyResponse {
  // Substring markers match case-insensitively; pattern markers run
  // against the raw html so they can target specific tags and attributes.
  const html = rawHtml.toLowerCase();

  // 1. Bot challenge / block — checked FIRST so it can never be mistaken
  //    for a not-found page.
  const challenge = CHALLENGE_MARKERS.find(m => html.includes(m));
  if (challenge || httpStatus === 403 || httpStatus === 429) {
    return {
      status: "unreachable",
      signal: challenge ? `challenge:${challenge}` : `http_${httpStatus}`,
      message: `${target.label} blocked the automated check. Use "Check for yourself" to confirm.`,
      checkedAt: now(),
    };
  }

  // 2. Server-side problems at the issuer — also not our user's fault.
  if (httpStatus >= 500) {
    return {
      status: "unreachable",
      signal: `http_${httpStatus}`,
      message: `${target.label}'s verification service is having problems right now.`,
      checkedAt: now(),
    };
  }

  // 3. A clean 404 from an issuer known to 404 on unknown credentials.
  if (httpStatus === 404 && target.trusts404) {
    return {
      status: "invalid",
      signal: "http_404",
      message: `${target.label} has no certificate with that ID.`,
      checkedAt: now(),
    };
  }

  // 4. Positive confirmation, checked BEFORE any not-found inference. A
  //    page that positively identifies the credential must never be
  //    overruled by a generic marker that merely suggests absence —
  //    otherwise a layout change could start denying real certificates.
  const validMarker = target.validMarkers.find(m => html.includes(m));
  const validPattern = target.validPatterns?.find(p => p.test(rawHtml));
  if (httpStatus === 200 && (validMarker || validPattern)) {
    return {
      status: "verified",
      signal: validMarker ? `valid_marker:${validMarker}` : `valid_pattern:${validPattern}`,
      message: `Confirmed on ${target.label}.`,
      checkedAt: now(),
    };
  }

  // 5. Explicit not-found signals.
  const notFound = target.notFoundMarkers.find(m => html.includes(m));
  const notFoundPattern = target.notFoundPatterns?.find(p => p.test(rawHtml));
  if (notFound || notFoundPattern) {
    return {
      status: "invalid",
      signal: notFound ? `not_found_marker:${notFound}` : `not_found_pattern:${notFoundPattern}`,
      message: `${target.label} has no certificate with that ID.`,
      checkedAt: now(),
    };
  }

  // 6. Page loaded but said nothing we recognise. Report honestly rather
  //    than guessing — and record the signal so the markers can be tuned
  //    against what these pages actually return.
  return {
    status: "inconclusive",
    signal: `no_marker:http_${httpStatus}:len_${html.length}`,
    message: `Couldn't read a clear answer from ${target.label}. Use "Check for yourself" to confirm.`,
    checkedAt: now(),
  };
}
