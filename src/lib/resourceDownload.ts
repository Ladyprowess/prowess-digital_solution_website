import { createHmac, timingSafeEqual } from "node:crypto";

// Shared by /api/resources/[id]/file (which verifies) and /api/content/access
// (which mints). Kept out of route.ts since Next.js route handlers only allow
// exporting HTTP method handlers and a small set of config fields - any other
// named export fails the build.
//
// email is signed as part of the payload, not just tacked onto the query
// string unsigned - the file route uses it to watermark PDFs with who's
// reading, so it has to be tamper-proof (can't let someone edit the query
// param to watermark a leaked link with a different name) exactly like the
// resourceId and expiry already were.
export function signDownloadUrl(resourceId: string, email?: string | null): string {
  const exp = String(Date.now() + 10 * 60 * 1000);
  const emailPart = email || "";
  const sig = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${resourceId}:${exp}:${emailPart}`)
    .digest("hex");
  const params = new URLSearchParams({ exp, sig });
  if (email) params.set("email", email);
  return `/api/resources/${resourceId}/file?${params.toString()}`;
}

export function verifyDownloadSignature(id: string, exp: string, sig: string, email?: string | null): boolean {
  const emailPart = email || "";
  const expected = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${id}:${exp}:${emailPart}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
