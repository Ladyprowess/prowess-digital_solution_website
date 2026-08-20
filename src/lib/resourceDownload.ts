import { createHmac, timingSafeEqual } from "node:crypto";

// Shared by /api/resources/[id]/file (which verifies) and /api/content/access
// (which mints). Kept out of route.ts since Next.js route handlers only allow
// exporting HTTP method handlers and a small set of config fields - any other
// named export fails the build.
export function signDownloadUrl(resourceId: string): string {
  const exp = String(Date.now() + 10 * 60 * 1000);
  const sig = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${resourceId}:${exp}`)
    .digest("hex");
  return `/api/resources/${resourceId}/file?exp=${exp}&sig=${sig}`;
}

export function verifyDownloadSignature(id: string, exp: string, sig: string): boolean {
  const expected = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${id}:${exp}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
