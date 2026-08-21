// Diagnostic endpoint with ZERO imports.
//
// Exists to separate "serverless functions don't work here at all" from
// "this particular function is broken" — when /api/verify-certificate
// returned FUNCTION_INVOCATION_FAILED, there was no way to tell which.
// It also reports the runtime facts that verification depends on, so a
// missing global fetch or an unexpected Node version is visible rather
// than inferred.

export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    node: process.version,
    hasFetch: typeof fetch === "function",
    hasAbortController: typeof AbortController === "function",
    checkedAt: new Date().toISOString(),
  });
}
