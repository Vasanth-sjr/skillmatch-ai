// Client-side orchestration for certificate verification: reads the cached
// result, calls /api/verify-certificate when the cache is cold or stale,
// and writes the outcome back.
//
// Caching matters here for a reason beyond speed — every live check hits a
// third party's public page, so re-checking an already-answered credential
// on every render would be abusive. Definitive answers are cached far
// longer than provisional ones.

import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus =
  | "verified" | "invalid" | "inconclusive" | "unreachable" | "unsupported";

export interface VerificationResult {
  status: VerificationStatus;
  signal: string;
  message: string;
  checkedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// A confirmed or refuted credential doesn't need frequent rechecking; an
// ambiguous one is worth retrying sooner in case the issuer was simply
// having a bad day.
const TTL_MS: Record<VerificationStatus, number> = {
  verified: 30 * DAY_MS,
  invalid: 30 * DAY_MS,
  unsupported: 90 * DAY_MS,
  inconclusive: 3 * DAY_MS,
  unreachable: 1 * DAY_MS,
};

function isStale(result: VerificationResult): boolean {
  const age = Date.now() - new Date(result.checkedAt).getTime();
  return age > (TTL_MS[result.status] ?? DAY_MS);
}

export async function loadCachedVerifications(
  userId: string,
): Promise<Record<string, VerificationResult>> {
  const { data, error } = await (supabase as any)
    .from("certificate_verifications")
    .select("issuer, credential_id, status, signal, message, checked_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to load certificate verifications:", error);
    return {};
  }

  const byKey: Record<string, VerificationResult> = {};
  for (const row of data ?? []) {
    byKey[cacheKey(row.issuer, row.credential_id)] = {
      status: row.status,
      signal: row.signal ?? "",
      message: row.message ?? "",
      checkedAt: row.checked_at,
    };
  }
  return byKey;
}

export function cacheKey(issuer: string, credentialId: string): string {
  return `${issuer}::${credentialId.trim()}`;
}

async function callVerifyApi(issuer: string, credentialId: string): Promise<VerificationResult> {
  const response = await fetch("/api/verify-certificate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issuer, credentialId }),
  });

  if (!response.ok && response.status !== 405) {
    // A non-JSON error (e.g. the function failed to boot) still must not
    // read as "invalid" — the credential itself is not what failed.
    return {
      status: "unreachable",
      signal: `api_http_${response.status}`,
      message: "The verification service didn't respond. Try the manual check.",
      checkedAt: new Date().toISOString(),
    };
  }

  return await response.json();
}

async function persist(
  userId: string, issuer: string, credentialId: string, result: VerificationResult,
) {
  const { error } = await (supabase as any)
    .from("certificate_verifications")
    .upsert({
      user_id: userId,
      issuer,
      credential_id: credentialId.trim(),
      status: result.status,
      signal: result.signal,
      message: result.message,
      checked_at: result.checkedAt,
    }, { onConflict: "user_id,issuer,credential_id" });

  if (error) console.error("Failed to cache certificate verification:", error);
}

/**
 * Verifies a credential, using the cached result unless it's missing,
 * stale, or `force` is set (the user pressing "Re-check").
 */
export async function verifyCertificate(
  userId: string,
  issuer: string,
  credentialId: string,
  cached: VerificationResult | undefined,
  force = false,
): Promise<VerificationResult> {
  if (!force && cached && !isStale(cached)) return cached;

  let result: VerificationResult;
  try {
    result = await callVerifyApi(issuer, credentialId);
  } catch (err: any) {
    result = {
      status: "unreachable",
      signal: `client_error:${err?.name ?? "unknown"}`,
      message: "Couldn't run the check from this browser. Try the manual check.",
      checkedAt: new Date().toISOString(),
    };
  }

  await persist(userId, issuer, credentialId, result);
  return result;
}
