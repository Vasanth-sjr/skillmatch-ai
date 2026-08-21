// Reads an uploaded certificate PDF and cross-checks what's printed on it
// against what the user claimed.
//
// ── WHAT THIS IS AND ISN'T ────────────────────────────────────────────────
//
// This is CORROBORATION, never VERIFICATION. A PDF can be edited, and a
// convincing forgery would pass every check below. Nothing here should
// ever render as "Verified".
//
// What it does buy us is real, though:
//
//   1. Convenience — the credential ID is printed on the certificate, so
//      we extract it rather than making the user hunt for it. Fewer
//      typos, which means fewer false "invalid format" results.
//
//   2. The only handle on unverifiable issuers — Coursera, Udemy and
//      NPTEL can't be checked server-side at all. A document that is
//      internally consistent is the strongest signal available for them.
//
//   3. Consistency is genuinely harder to fake than a typed string.
//      Someone inventing a credential ID types 12 characters. Matching
//      the printed verify URL, the issuer's expected wording, AND the
//      holder's name to the profile takes deliberate effort. That
//      difference is what the tiers below are measuring.

import { getIssuer } from "@/data/certificateIssuers";

export const MAX_CERT_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
export const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg"];

export type DocumentConsistency = "strong" | "partial" | "weak" | "unreadable";

export interface DocumentAnalysis {
  /** Did we get any text out of the file at all? */
  readable: boolean;
  /** A verification URL for the claimed issuer appears on the document. */
  foundIssuerUrl: boolean;
  /** Credential ID lifted from the printed verification URL. */
  extractedCredentialId: string | null;
  /** Null when we had nothing to compare against. */
  matchesEnteredId: boolean | null;
  /** Null when the profile name is unknown or no name was found. */
  holderNameMatches: boolean | null;
  /** Issuer-specific wording found on the document. */
  expectedTermsFound: string[];
  consistency: DocumentConsistency;
  /** Human-readable findings for the UI. */
  notes: string[];
}

/** Extracts text from a PDF using the same pdfjs setup as the ATS Checker. */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const { default: workerUrl } = await import(
    /* @vite-ignore */ "pdfjs-dist/build/pdf.worker.min.mjs?url"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    fullText += (content.items as Array<{ str?: string; hasEOL?: boolean }>)
      .map(item => (item.hasEOL ? (item.str || "") + "\n" : (item.str || "") + " "))
      .join("") + "\n";
  }

  // Certificates often carry the verify URL as a link annotation rather
  // than as visible text, so harvest those too.
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const annotations = await page.getAnnotations();
    for (const a of annotations as Array<{ url?: string; unsafeUrl?: string }>) {
      const url = a.url ?? a.unsafeUrl;
      if (url) fullText += " " + url;
    }
  }

  return fullText;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Loose name matching: a certificate may print "VASANTH S J R" where the
 * profile says "Vasanth S.J.R". Requiring an exact match would fail
 * constantly, so we check that the distinctive parts of the profile name
 * all appear. Single-letter initials are ignored — they carry almost no
 * discriminating power and their spacing varies wildly between issuers.
 */
function nameAppearsIn(text: string, profileName: string): boolean | null {
  const name = normalizeName(profileName);
  const parts = name.split(" ").filter(p => p.length > 1);
  if (parts.length === 0) return null;

  const haystack = normalizeName(text);
  return parts.every(p => haystack.includes(p));
}

export function analyzeCertificateDocument(
  text: string,
  issuerKey: string,
  enteredCredentialId: string,
  profileFullName: string | null,
): DocumentAnalysis {
  const notes: string[] = [];

  if (!text || text.trim().length < 20) {
    return {
      readable: false,
      foundIssuerUrl: false,
      extractedCredentialId: null,
      matchesEnteredId: null,
      holderNameMatches: null,
      expectedTermsFound: [],
      consistency: "unreadable",
      notes: [
        "Couldn't read any text from this file. Image-only scans and " +
        "photos can't be analysed — upload the PDF you downloaded from the issuer.",
      ],
    };
  }

  const issuer = getIssuer(issuerKey);
  const sig = issuer?.document ?? null;
  const lower = text.toLowerCase();

  // ── Printed verification URL ────────────────────────────────────────
  let extractedCredentialId: string | null = null;
  let foundIssuerUrl = false;

  if (sig) {
    for (const pattern of sig.urlPatterns) {
      const m = text.match(pattern);
      if (m) {
        foundIssuerUrl = true;
        extractedCredentialId = m[1] ?? null;
        break;
      }
    }
    if (foundIssuerUrl) {
      notes.push(`✓ Found a ${issuer!.label} verification link printed on the certificate`);
    } else {
      notes.push(`⚠ No ${issuer!.label} verification link found on this document`);
    }
  }

  // ── Entered ID vs printed ID ────────────────────────────────────────
  let matchesEnteredId: boolean | null = null;
  const entered = enteredCredentialId.trim();
  if (extractedCredentialId && entered) {
    matchesEnteredId = extractedCredentialId.toLowerCase() === entered.toLowerCase();
    notes.push(matchesEnteredId
      ? "✓ The credential ID you entered matches the one on the certificate"
      : `⚠ The certificate shows ID "${extractedCredentialId}", not the one you entered`);
  } else if (extractedCredentialId && !entered) {
    notes.push(`✓ Credential ID read from the certificate: ${extractedCredentialId}`);
  }

  // ── Issuer wording ──────────────────────────────────────────────────
  const expectedTermsFound = (sig?.expectedTerms ?? []).filter(t => lower.includes(t));
  if (sig && expectedTermsFound.length > 0) {
    notes.push(`✓ Contains wording typical of a ${issuer!.label} certificate`);
  }

  // ── Holder name ─────────────────────────────────────────────────────
  const holderNameMatches = profileFullName ? nameAppearsIn(text, profileFullName) : null;
  if (holderNameMatches === true) {
    notes.push("✓ The name on the certificate matches your profile");
  } else if (holderNameMatches === false) {
    notes.push("⚠ Your profile name doesn't appear on this certificate");
  }

  // ── Overall consistency ─────────────────────────────────────────────
  // A contradiction outranks any amount of corroboration: if the printed
  // ID disagrees with the entered one, the claim is inconsistent no
  // matter how many other checks passed.
  let consistency: DocumentConsistency;
  if (matchesEnteredId === false) {
    consistency = "weak";
  } else {
    const positives =
      (foundIssuerUrl ? 1 : 0) +
      (matchesEnteredId === true ? 1 : 0) +
      (holderNameMatches === true ? 1 : 0) +
      (expectedTermsFound.length > 0 ? 1 : 0);
    consistency = positives >= 3 ? "strong" : positives >= 1 ? "partial" : "weak";
  }

  return {
    readable: true,
    foundIssuerUrl,
    extractedCredentialId,
    matchesEnteredId,
    holderNameMatches,
    expectedTermsFound,
    consistency,
    notes,
  };
}

/** Guard before we touch the file at all. */
export function validateCertificateFile(file: File): string | null {
  if (file.size > MAX_CERT_FILE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB.`;
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    return "Upload a PDF, PNG or JPEG.";
  }
  return null;
}
