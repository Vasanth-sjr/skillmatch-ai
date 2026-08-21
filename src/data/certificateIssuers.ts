// Certificate issuer registry — the single source of truth for both the
// instant client-side format check and the server-side live verification
// performed by /api/verify-certificate.
//
// IMPORTANT — what this can and cannot do:
//
// None of these providers expose a public credential-verification API.
// Their "verify" pages are HTML pages intended for human readers. So
// `autoVerify` works by fetching that page server-side and looking for
// the markers a provider renders when a credential does not exist.
// That means:
//
//   1. It is inherently fragile — a site redesign can change the markers.
//   2. Several providers sit behind bot protection (Cloudflare et al.),
//      so a fetch may be challenged rather than answered. A blocked or
//      errored fetch MUST resolve to "unreachable", never "invalid" —
//      telling a user their genuine certificate is fake because we got
//      rate-limited would be far worse than admitting we couldn't check.
//   3. `verifyUrl` (the human "check for yourself" link) is always
//      offered, including for issuers we cannot automate at all.
//
// ID FORMATS are deliberately PERMISSIVE. A false "invalid format" on a
// real certificate is a much worse failure than letting a malformed code
// through to the live check, so each pattern is tuned to catch obvious
// garbage (empty, too short, wrong character class, wrong prefix) rather
// than to assert an exact grammar. Tighten these only against real
// sample credentials.
//
// ── MEASURED BEHAVIOUR (probed 2026-08-21, bogus credential IDs) ────────
// These `autoVerify` settings are not guesses; each was checked against
// the live endpoint. Re-probe before changing any of them.
//
//   HackerRank    404 for unknown            → auto-verify works
//   edX           404 + "page not found|edx" → auto-verify works
//   freeCodeCamp  404 for unknown AND for a real-but-private profile
//                 (fCC profiles are private by default) → REJECTED, a
//                 404 there cannot distinguish fake from unshared
//   Credly        200 for unknown, but a real badge carries an og:title
//                 and a bogus one carries none → positive-marker only
//   Coursera      200 for BOTH, same marketing shell, but the og: meta
//                 tags differ decisively (see the entry below) →
//                 auto-verify works via scoped patterns
//   Udemy         403 + Cloudflare "just a moment" challenge → the check
//                 is blocked, so auto-verify is disabled
//
// Udemy and freeCodeCamp are deliberately manual-only. A check that
// cannot distinguish a real credential from a fake one is worse than no
// check, because it launders a guess into a badge.
//
// Coursera was ALSO manual-only until a real credential became available
// to diff against a bogus one. The earlier "no server-side signal exists"
// conclusion was drawn from the not-found page alone and was wrong — a
// reminder that a negative probe cannot establish that two cases are
// indistinguishable. Always diff both.
//
// STILL UNCONFIRMED: the *positive* path has not been exercised for
// HackerRank or edX — only the negative path was measurable without a
// genuine credential. Both use single-purpose public certificate URLs
// with no privacy default, which is why their 404 is trusted where
// freeCodeCamp's is not. Confirm with a real credential when one is
// available; until then the "inconclusive" fallback keeps an
// unrecognised page from being scored either way.

export type IssuerKey =
  | "Coursera" | "Google" | "AWS" | "Microsoft" | "LinkedIn Learning"
  | "Udemy" | "edX" | "NPTEL" | "IBM" | "Oracle" | "Cisco" | "Meta"
  | "HackerRank" | "freeCodeCamp" | "Infosys Springboard"
  | "Simplilearn" | "Great Learning" | "Other";

export interface AutoVerifyConfig {
  /** URL the server fetches to determine whether the credential exists. */
  fetchUrl: (id: string) => string;
  /** Lowercased substrings that indicate the credential does NOT exist. */
  notFoundMarkers: string[];
  /** Lowercased substrings that positively confirm a real credential page. */
  validMarkers: string[];
  /**
   * Regexes run against the RAW html, for issuers where the signal lives
   * in a specific element rather than anywhere in the body.
   *
   * Coursera is the reason these exist: its 376KB marketing shell mentions
   * enough that a plain substring like "power bi" matches the not-found
   * page too. Only the og: meta tags actually distinguish a real
   * credential, so the check has to be scoped to them.
   */
  validPatterns?: RegExp[];
  /** Regexes on raw html that positively indicate no such credential. */
  notFoundPatterns?: RegExp[];
  /** True when the provider reliably 404s for unknown credentials. */
  trusts404: boolean;
}

/**
 * How this issuer's credential appears on the certificate document itself.
 *
 * Nearly every provider prints its verification URL on the PDF, which lets
 * us pull the credential ID straight out of an uploaded file instead of
 * asking the user to find and retype it. This matters most for the issuers
 * we CANNOT check server-side (Coursera, Udemy, NPTEL) — the document is
 * the only handle we get on them.
 *
 * To be explicit about what this is worth: finding a printed URL proves
 * the document says what it should, NOT that the document is genuine. A
 * PDF can be edited. Document analysis produces corroboration, never
 * verification — see certificateDocument.ts.
 */
export interface DocumentSignature {
  /** Patterns locating the verify URL in extracted text; group 1 = credential ID. */
  urlPatterns: RegExp[];
  /** Lowercase terms a genuine certificate from this issuer should contain. */
  expectedTerms: string[];
}

export interface CertificateIssuer {
  key: IssuerKey;
  label: string;
  /** Permissive shape check. `null` means we can't meaningfully validate. */
  idFormat: RegExp | null;
  /** Shown to the user when the format check fails. */
  formatHint: string;
  /** Official page a human can open to confirm the credential themselves. */
  verifyUrl: ((id: string) => string) | null;
  /** Server-side automated check, when the provider permits one. */
  autoVerify: AutoVerifyConfig | null;
  /**
   * How to read this issuer's credential off an uploaded certificate.
   * Omitted for issuers whose printed certificate layout we haven't
   * confirmed — absence means "we won't guess", not "uploads are useless":
   * the file is still stored and the name/term cross-checks still run.
   */
  document?: DocumentSignature | null;
  /** Why automation is unavailable, surfaced in the UI when autoVerify is null. */
  manualOnlyReason?: string;
}

// Markers that mean "this page is a bot challenge, not an answer" — checked
// before any not-found marker so a challenge can never read as "invalid".
export const CHALLENGE_MARKERS = [
  "just a moment",
  "checking your browser",
  "enable javascript and cookies",
  "cf-browser-verification",
  "captcha",
  "access denied",
  "unusual traffic",
];

export const CERTIFICATE_ISSUERS: CertificateIssuer[] = [
  {
    key: "Coursera",
    label: "Coursera",
    // Real Coursera codes are typically 12 uppercase alphanumerics
    // (e.g. 8ZQ3FKMHXW5T), but older/specialization codes vary in length.
    idFormat: /^[A-Z0-9]{8,24}$/,
    formatHint: "Coursera codes are 8–24 uppercase letters and digits, e.g. 8ZQ3FKMHXW5T",
    verifyUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
    // Measured against a real credential AND a bogus one (2026-08-21):
    // both return HTTP 200 and the same 376KB+ marketing shell, but the
    // og: meta tags differ decisively —
    //
    //   real  og:title = "Completion Certificate for <course name>"
    //   bogus og:title = "Coursera | Online Courses & Credentials..."
    //
    // Body substrings are NOT usable here: the marketing shell mentions
    // enough that even "power bi" matches the not-found page. The check
    // must be scoped to the meta tags, hence the pattern form.
    autoVerify: {
      fetchUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: [],
      validPatterns: [
        /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']*?(?:completion|specialization|professional)\s+certificate\s+for/i,
        /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']*?this certificate verifies/i,
      ],
      notFoundPatterns: [
        // The generic marketing og:title, which only the not-found page
        // serves. Checked after the positive patterns, so a real page can
        // never be denied by it.
        /<meta[^>]+property=["']og:title["'][^>]+content=["']Coursera\s*(?:\||&#x7c;)/i,
      ],
      trusts404: true,
    },
    document: {
      urlPatterns: [
        /coursera\.org\/account\/accomplishments\/(?:verify|professional-cert|specialization)\/([A-Z0-9]{8,24})/i,
        /coursera\.org\/verify\/(?:professional-cert\/|specialization\/)?([A-Z0-9]{8,24})/i,
      ],
      expectedTerms: ["coursera", "has successfully completed", "course certificate"],
    },
  },
  {
    key: "Google",
    label: "Google Career Certificates",
    // Google's career certificates are issued and verified through Coursera.
    idFormat: /^[A-Z0-9]{8,24}$/,
    formatHint: "Google Career Certificates are verified via Coursera — use the Coursera credential code",
    verifyUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
    // Same mechanism as Coursera — Google's career certificates are issued
    // and verified through it.
    autoVerify: {
      fetchUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: [],
      validPatterns: [
        /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']*?(?:completion|specialization|professional)\s+certificate\s+for/i,
        /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']*?this certificate verifies/i,
      ],
      notFoundPatterns: [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']Coursera\s*(?:\||&#x7c;)/i,
      ],
      trusts404: true,
    },
    document: {
      urlPatterns: [
        /coursera\.org\/account\/accomplishments\/(?:verify|professional-cert|specialization)\/([A-Z0-9]{8,24})/i,
        /coursera\.org\/verify\/(?:professional-cert\/|specialization\/)?([A-Z0-9]{8,24})/i,
      ],
      expectedTerms: ["coursera", "google", "has successfully completed"],
    },
  },
  {
    key: "Udemy",
    label: "Udemy",
    // e.g. UC-1a2b3c4d-5e6f-7890-abcd-ef1234567890
    idFormat: /^UC-[A-Za-z0-9-]{8,60}$/,
    formatHint: "Udemy codes start with 'UC-' followed by a long identifier, e.g. UC-1a2b3c4d-…",
    verifyUrl: id => `https://www.udemy.com/certificate/${encodeURIComponent(id)}/`,
    // Measured: Udemy answers automated requests with a Cloudflare
    // challenge (403 "just a moment"), so no automated check is possible.
    autoVerify: null,
    manualOnlyReason: "Udemy blocks automated verification requests",
    document: {
      urlPatterns: [
        /ude\.my\/(UC-[A-Za-z0-9-]{8,60})/i,
        /udemy\.com\/certificate\/(UC-[A-Za-z0-9-]{8,60})/i,
      ],
      expectedTerms: ["udemy", "certificate of completion", "instructors"],
    },
  },
  {
    key: "freeCodeCamp",
    label: "freeCodeCamp",
    // freeCodeCamp verifies by username + certification slug, not a code.
    idFormat: /^[A-Za-z0-9_-]{2,60}$/,
    formatHint: "Enter your freeCodeCamp username (certificates are verified by username, not a code)",
    verifyUrl: id => `https://www.freecodecamp.org/${encodeURIComponent(id)}`,
    // Measured and REJECTED: a profile URL returns 404 both for a
    // nonexistent user AND for a real user whose profile is private —
    // and fCC profiles are private by default. A 404 therefore cannot
    // distinguish "no such certificate" from "not shared publicly", so
    // trusting it would brand genuine certificates as fake.
    //
    // The real certificate URL is /certification/{username}/{cert-slug},
    // which needs a course slug we don't store. Until we capture that,
    // this stays manual-only.
    autoVerify: null,
    manualOnlyReason:
      "freeCodeCamp profiles are private by default, so a missing page doesn't prove a certificate is fake",
    document: {
      urlPatterns: [/freecodecamp\.org\/certification\/([^/\s]+)\/[^/\s]+/i],
      expectedTerms: ["freecodecamp", "developer certification"],
    },
  },
  {
    key: "HackerRank",
    label: "HackerRank",
    idFormat: /^[A-Za-z0-9]{8,40}$/,
    formatHint: "HackerRank certificate IDs are 8–40 letters and digits",
    verifyUrl: id => `https://www.hackerrank.com/certificates/${encodeURIComponent(id)}`,
    // Measured: unknown certificate IDs return a clean HTTP 404. The body
    // is a large SPA shell in both cases, so trust the status code only.
    autoVerify: {
      fetchUrl: id => `https://www.hackerrank.com/certificates/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: ["hackerrank"],
      trusts404: true,
    },
    document: {
      urlPatterns: [/hackerrank\.com\/certificates\/([A-Za-z0-9]{8,40})/i],
      expectedTerms: ["hackerrank", "certificate of accomplishment"],
    },
  },
  {
    key: "NPTEL",
    label: "NPTEL",
    // e.g. NPTEL24CS45S123400045 — year + subject code + serial.
    idFormat: /^NPTEL[0-9A-Z]{6,30}$/i,
    formatHint: "NPTEL roll numbers start with 'NPTEL' followed by year and course codes, e.g. NPTEL24CS45S1234…",
    verifyUrl: () => "https://nptel.ac.in/noc",
    // NPTEL has no stable single-URL credential lookup — verification runs
    // through their portal with additional inputs, so this is manual-only.
    autoVerify: null,
    manualOnlyReason: "NPTEL verifies through its course portal rather than a direct credential URL",
    document: {
      // NPTEL certificates print the roll number and a verification URL
      // whose host has changed across cohorts, so match the roll number
      // itself as well as the URL forms seen in circulation.
      urlPatterns: [
        /nptel\.ac\.in\/[^\s]*?\b(NPTEL[0-9A-Z]{6,30})\b/i,
        /\b(NPTEL[0-9]{2}[A-Z]{2}[0-9A-Z]{4,24})\b/i,
      ],
      expectedTerms: ["nptel", "indian institute of technology", "online certification"],
    },
  },
  {
    key: "edX",
    label: "edX",
    idFormat: /^[a-f0-9]{16,64}$/i,
    formatHint: "edX certificate IDs are a long hexadecimal string",
    verifyUrl: id => `https://courses.edx.org/certificates/${encodeURIComponent(id)}`,
    // Measured: unknown IDs return HTTP 404 with "page not found | edx"
    // in the <title> — both signals agree, so this one is well-grounded.
    autoVerify: {
      fetchUrl: id => `https://courses.edx.org/certificates/${encodeURIComponent(id)}`,
      notFoundMarkers: ["page not found | edx"],
      validMarkers: ["successfully completed", "verified certificate"],
      trusts404: true,
    },
    document: {
      urlPatterns: [/edx\.org\/certificates\/([a-f0-9]{16,64})/i],
      expectedTerms: ["edx", "successfully completed", "verified certificate"],
    },
  },
  {
    key: "AWS",
    label: "AWS",
    idFormat: /^[A-Za-z0-9-]{8,60}$/,
    formatHint: "AWS validation numbers are 8–60 letters, digits and dashes",
    verifyUrl: () => "https://aws.amazon.com/verification",
    // AWS verification requires a validation number AND the holder's name
    // entered into a form — it cannot be resolved from a URL alone.
    autoVerify: null,
    manualOnlyReason: "AWS requires the validation number and your name entered on their verification form",
  },
  {
    key: "Microsoft",
    label: "Microsoft",
    idFormat: /^[A-Za-z0-9._-]{6,80}$/,
    formatHint: "Enter the credential ID or share code from your Microsoft Learn transcript",
    verifyUrl: id => `https://learn.microsoft.com/api/credentials/share/en-us/${encodeURIComponent(id)}`,
    autoVerify: null,
    manualOnlyReason: "Microsoft Learn credentials are shared via a personal transcript link",
  },
  {
    key: "LinkedIn Learning",
    label: "LinkedIn Learning",
    idFormat: null,
    formatHint: "",
    verifyUrl: null,
    autoVerify: null,
    manualOnlyReason: "LinkedIn Learning does not offer public certificate verification",
  },
  {
    key: "IBM",
    label: "IBM",
    idFormat: /^[A-Za-z0-9-]{6,80}$/,
    formatHint: "IBM credential IDs are 6–80 letters, digits and dashes",
    verifyUrl: id => `https://www.credly.com/badges/${encodeURIComponent(id)}`,
    // Measured: Credly returns HTTP 200 even for a nonexistent badge, so
    // trusts404 is false. The discriminator is og:title — a real badge
    // page carries one, a nonexistent one carries none. Absence therefore
    // yields "inconclusive", never "invalid".
    autoVerify: {
      fetchUrl: id => `https://www.credly.com/badges/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: ['property="og:title"'],
      trusts404: false,
    },
    document: {
      urlPatterns: [/credly\.com\/badges\/([a-f0-9-]{16,60})/i],
      expectedTerms: ["credly", "issued by", "badge"],
    },
  },
  {
    key: "Oracle",
    label: "Oracle",
    idFormat: /^[A-Za-z0-9-]{6,80}$/,
    formatHint: "Oracle credential IDs are 6–80 letters, digits and dashes",
    verifyUrl: () => "https://catalog-education.oracle.com/pls/certview/sharebadge",
    autoVerify: null,
    manualOnlyReason: "Oracle CertView requires a share token entered on their portal",
  },
  {
    key: "Cisco",
    label: "Cisco",
    idFormat: /^[A-Za-z0-9-]{6,80}$/,
    formatHint: "Cisco credential IDs are 6–80 letters, digits and dashes",
    verifyUrl: id => `https://www.credly.com/badges/${encodeURIComponent(id)}`,
    // Measured: Credly returns HTTP 200 even for a nonexistent badge, so
    // trusts404 is false. The discriminator is og:title — a real badge
    // page carries one, a nonexistent one carries none. Absence therefore
    // yields "inconclusive", never "invalid".
    autoVerify: {
      fetchUrl: id => `https://www.credly.com/badges/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: ['property="og:title"'],
      trusts404: false,
    },
    document: {
      urlPatterns: [/credly\.com\/badges\/([a-f0-9-]{16,60})/i],
      expectedTerms: ["credly", "issued by", "badge"],
    },
  },
  {
    key: "Meta",
    label: "Meta",
    idFormat: /^[A-Z0-9]{8,24}$/,
    formatHint: "Meta certificates are verified via Coursera — use the Coursera credential code",
    verifyUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
    autoVerify: {
      fetchUrl: id => `https://www.coursera.org/verify/${encodeURIComponent(id)}`,
      notFoundMarkers: [],
      validMarkers: [],
      validPatterns: [
        /<meta[^>]+property=["']og:title["'][^>]+content=["'][^"']*?(?:completion|specialization|professional)\s+certificate\s+for/i,
        /<meta[^>]+property=["']og:description["'][^>]+content=["'][^"']*?this certificate verifies/i,
      ],
      notFoundPatterns: [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']Coursera\s*(?:\||&#x7c;)/i,
      ],
      trusts404: true,
    },
    document: {
      urlPatterns: [
        /coursera\.org\/account\/accomplishments\/(?:verify|professional-cert|specialization)\/([A-Z0-9]{8,24})/i,
        /coursera\.org\/verify\/(?:professional-cert\/|specialization\/)?([A-Z0-9]{8,24})/i,
      ],
      expectedTerms: ["coursera", "meta", "has successfully completed"],
    },
  },
  {
    key: "Infosys Springboard",
    label: "Infosys Springboard",
    idFormat: null,
    formatHint: "",
    verifyUrl: null,
    autoVerify: null,
    manualOnlyReason: "Infosys Springboard does not offer public certificate verification",
  },
  {
    key: "Simplilearn",
    label: "Simplilearn",
    idFormat: /^[A-Za-z0-9]{4,40}$/,
    formatHint: "Simplilearn certificate codes are 4–40 letters and digits",
    verifyUrl: id => `https://certificates.simplicdn.net/share/${encodeURIComponent(id)}.png`,
    autoVerify: null,
    manualOnlyReason: "Simplilearn serves certificates as images without a machine-readable status",
  },
  {
    key: "Great Learning",
    label: "Great Learning",
    idFormat: /^[A-Za-z0-9]{4,40}$/,
    formatHint: "Great Learning verification codes are 4–40 letters and digits",
    verifyUrl: () => "https://www.mygreatlearning.com/verify-certificate",
    autoVerify: null,
    manualOnlyReason: "Great Learning requires the code entered on their verification form",
  },
  {
    key: "Other",
    label: "Other",
    idFormat: null,
    formatHint: "",
    verifyUrl: null,
    autoVerify: null,
    manualOnlyReason: "Automatic verification isn't available for this issuer",
  },
];

const BY_KEY = new Map(CERTIFICATE_ISSUERS.map(i => [i.key, i]));

export function getIssuer(key: string): CertificateIssuer | null {
  return BY_KEY.get(key as IssuerKey) ?? null;
}

/** Issuer names in the order the Profile form's dropdown should show them. */
export const CERT_ISSUER_LABELS = CERTIFICATE_ISSUERS.map(i => i.key);
