import { POST as subscribe } from "@/app/api/subscribe/route";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  return subscribe(new Request(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: body?.email, preferences: ["jobs"], source: "careers" }) }));
}
