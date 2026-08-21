// AMSCE — Certificate Analyzer (Phase 5)
//
// The fifth evidence module, and the only one whose strength depends on
// INDEPENDENT confirmation rather than on something the user wrote.
//
// The other four modules all read material the user authored: their
// profile, their interview answers, their stated career goal, the
// resources they clicked. A certificate that an issuer has confirmed is
// categorically different — it is the one signal in the system that a
// third party vouched for. That's why trust level, not mere presence,
// determines its weight here:
//
//   verified      1.00  the issuer confirmed it
//   corroborated  0.65  document is internally consistent, issuer silent
//   self_reported 0.25  a well-formed claim and nothing more
//   disputed      0.00  the issuer denied it, or the document contradicts
//
// The gap between verified and self_reported is deliberately wide. If an
// unbacked claim scored close to a confirmed one, the whole verification
// pipeline would be decorative.

import { extractVocabTerms, canonical } from "@/lib/skillVocabulary";
import { getSkillEcosystem } from "@/data/skillEcosystems";
import { TrustLevel } from "@/lib/certificates/credentialTrust";
import { CertificateEvidence } from "@/lib/certificates/certificateEvidence";

const TRUST_VALUE: Record<TrustLevel, number> = {
  verified: 1.0,
  corroborated: 0.65,
  self_reported: 0.25,
  disputed: 0,
};

export interface CertificateMatch {
  /** Evidence strength in [0,1] before freshness discounting. */
  value: number;
  /** ISO timestamp derived from the issue date, or null if not given. */
  timestamp: string | null;
  /** Whether the strongest matching certificate has lapsed. */
  expired: boolean;
  /** Name of the certificate that produced the match, for explainability. */
  matchedName: string | null;
  trustLevel: TrustLevel | null;
}

const EMPTY: CertificateMatch = {
  value: 0, timestamp: null, expired: false, matchedName: null, trustLevel: null,
};

/** "2024-07" → "2024-07-15"; anything unparseable → null. */
function monthToIso(value: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-15`;
}

function hasExpired(expiryDate: string): boolean {
  const iso = monthToIso(expiryDate);
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/**
 * Does this certificate relate to the skill being rated?
 *
 * Matching runs over the certificate's title and issuer using the same
 * vocabulary engine the rest of the platform shares, so "Analysis and
 * Visualization of Data with Power BI" resolves to `powerbi` and lines up
 * with the "Power BI" entry in Skill Reviews.
 *
 * An ecosystem-adjacent hit (a Kubernetes certificate against the Docker
 * skill, say) counts for less than a direct one — related is not the same
 * as the thing itself.
 */
function relevanceOf(cert: CertificateEvidence, vocabTerms: string[]): number {
  const certTerms = extractVocabTerms(`${cert.name} ${cert.issuer}`).map(canonical);
  if (certTerms.length === 0) return 0;

  const wanted = vocabTerms.map(canonical);
  if (wanted.some(t => certTerms.includes(t))) return 1;

  const related = new Set(
    vocabTerms.flatMap(t => getSkillEcosystem(t).related.map(canonical)),
  );
  if (certTerms.some(t => related.has(t))) return 0.5;

  return 0;
}

/**
 * Strongest certificate evidence for one skill.
 *
 * When several certificates match, the best one wins rather than their
 * sum — holding three overlapping certificates for the same skill is not
 * three times the evidence, and letting them accumulate would reward
 * padding a profile over actually being verified.
 */
export function analyzeCertificates(
  certificates: CertificateEvidence[],
  vocabTerms: string[],
): CertificateMatch {
  let best = EMPTY;

  for (const cert of certificates) {
    const relevance = relevanceOf(cert, vocabTerms);
    if (relevance === 0) continue;

    const expired = hasExpired(cert.expiryDate);
    // A lapsed certificate is not worthless — it still evidences that the
    // skill was once demonstrated — but it should not read as current.
    const expiryFactor = expired ? 0.4 : 1;
    const value = TRUST_VALUE[cert.trustLevel] * relevance * expiryFactor;

    if (value > best.value) {
      best = {
        value,
        timestamp: monthToIso(cert.issueDate),
        expired,
        matchedName: cert.name,
        trustLevel: cert.trustLevel,
      };
    }
  }

  return best;
}
