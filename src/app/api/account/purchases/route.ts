import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { signDownloadUrl } from "@/lib/resourceDownload";
import { withBonusReadAccess, type EbookFormat } from "@/lib/resources/ebookFormats";

export const runtime = "nodejs";
const ITEM_TABLE: Record<string, string> = { resource: "resources", course: "courses", career_path: "career_paths" };
type AccountPayment = { id: string; item_type: string; item_id: string; amount: number; currency: string; created_at: string; title: string; slug: string | null; href: string | null; description: string | null; formats: EbookFormat[]; download_url: string | null };
type ContentRow = { id:string; item_type:string; item_id:string; amount:number; currency:string; format:string; created_at:string };
type PriceRow = { id:string; currency:string; amount_usd:number|null; amount_ngn:number|null; created_at:string };
type BusinessRow = PriceRow & { service_slug:string; paid_at:string|null; business_service_offerings:{title?:string}|{title?:string}[]|null };
type SubscriptionRow = PriceRow & { plan_slug:string; billing_interval:string; subscription_status:string };
type ConsultationRow = PriceRow & { service_id:string; start_at:string|null; consultation_services:{name?:string}|{name?:string}[]|null };
type EventRow = { id:string; event_id:string; amount_paid:number|null; currency:string|null; created_at:string; events:{title?:string;slug?:string}|{title?:string;slug?:string}[]|null };
type ChargeRow = { kind:"membership"|"premium_membership"; subscription_id:string; reference:string; occurred_at:string };
const amountFor = (row: { currency?: string | null; amount_usd?: number | null; amount_ngn?: number | null; amount?: number | null }) => { const currency = (row.currency || (row.amount_ngn != null ? "NGN" : "USD")).toUpperCase(); return { currency, amount: Number(currency === "NGN" ? row.amount_ngn ?? row.amount ?? 0 : row.amount_usd ?? row.amount ?? 0) }; };

export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const db = supabaseAdmin();
  const owner = `user_id.eq.${member.id},email.eq.${member.email.toLowerCase()}`;
  const results = await Promise.all([
    db.from("purchases").select("id,item_type,item_id,amount,currency,format,created_at").or(owner).eq("payment_status", "paid"),
    db.from("business_service_orders").select("id,service_slug,currency,amount_usd,amount_ngn,paid_at,created_at,business_service_offerings(title)").or(owner).eq("payment_status", "paid"),
    db.from("premium_membership_subscriptions").select("id,plan_slug,billing_interval,currency,amount_usd,amount_ngn,subscription_status,created_at").eq("user_id", member.id).eq("payment_status", "paid"),
    db.from("membership_subscriptions").select("id,plan_slug,billing_interval,currency,amount_usd,amount_ngn,subscription_status,created_at").or(owner).eq("payment_status", "paid"),
    db.from("skill_to_business_purchases").select("id,currency,amount_usd,amount_ngn,created_at").or(owner).eq("payment_status", "paid"),
    db.from("consultation_bookings").select("id,service_id,currency,amount_usd,amount_ngn,start_at,created_at,consultation_services(name)").or(owner).eq("payment_status", "paid"),
    db.from("event_registrations").select("id,event_id,currency,amount_paid,created_at,events(title,slug)").or(owner).eq("payment_status", "paid"),
  ]);
  const failure = results.find((result) => result.error);
  if (failure?.error) return NextResponse.json({ ok: false, error: failure.error.message }, { status: 500 });
  const contentRows = (results[0].data || []) as ContentRow[];
  const businessRows = (results[1].data || []) as unknown as BusinessRow[];
  const premiumRows = (results[2].data || []) as SubscriptionRow[];
  const membershipRows = (results[3].data || []) as SubscriptionRow[];
  const skillRows = (results[4].data || []) as PriceRow[];
  const consultationRows = (results[5].data || []) as unknown as ConsultationRow[];
  const eventRows = (results[6].data || []) as unknown as EventRow[];
  const subscriptionIds = [...premiumRows, ...membershipRows].map((row) => row.id);
  const { data: chargeData, error: chargeError } = subscriptionIds.length ? await db.from("subscription_charge_events").select("kind,subscription_id,reference,occurred_at").in("subscription_id", subscriptionIds).eq("outcome", "paid") : { data: [], error: null };
  if (chargeError) return NextResponse.json({ ok: false, error: chargeError.message }, { status: 500 });
  const charges = (chargeData || []) as ChargeRow[];

  const grouped = new Map<string, AccountPayment>();
  for (const row of contentRows) {
    const key = `${row.item_type}:${row.item_id}`; const current = grouped.get(key);
    if (current) { if (["read", "download", "hardcopy"].includes(row.format)) current.formats.push(row.format as EbookFormat); continue; }
    grouped.set(key, { id: row.id, item_type: row.item_type, item_id: row.item_id, amount: Number(row.amount), currency: row.currency, created_at: row.created_at, title: "Purchased content", slug: null, href: null, description: null, formats: row.format ? [row.format as EbookFormat] : [], download_url: null });
  }
  const content = await Promise.all(Array.from(grouped.values()).map(async (item) => {
    const table = ITEM_TABLE[item.item_type]; const { data } = table ? await db.from(table).select("title,slug").eq("id", item.item_id).maybeSingle() : { data: null };
    const formats = withBonusReadAccess(item.formats); return { ...item, title: data?.title || item.title, slug: data?.slug || null, formats, download_url: formats.includes("download") ? signDownloadUrl(item.item_id, member.email) : null };
  }));

  const extras: AccountPayment[] = [];
  for (const row of businessRows) { const price = amountFor(row); const relation = row.business_service_offerings as unknown as { title?: string } | { title?: string }[] | null; const offering = Array.isArray(relation) ? relation[0] : relation; extras.push({ id: row.id, item_type: "business_service", item_id: row.service_slug, ...price, created_at: row.paid_at || row.created_at, title: offering?.title || "Business service", slug: row.service_slug, href: `/services/${row.service_slug}`, description: "One-time business service", formats: [], download_url: null }); }
  for (const row of premiumRows) { const price = amountFor(row); const paidCharges = charges.filter((charge) => charge.kind === "premium_membership" && charge.subscription_id === row.id); for (const charge of paidCharges.length ? paidCharges : [{ reference: row.id, occurred_at: row.created_at }]) extras.push({ id: `${row.id}:${charge.reference}`, item_type: "premium_membership", item_id: row.plan_slug, ...price, created_at: charge.occurred_at, title: "Premium Membership", slug: null, href: "/account/membership", description: `${row.billing_interval === "annually" ? "Annual" : "Monthly"} plan · ${row.subscription_status}`, formats: [], download_url: null }); }
  for (const row of membershipRows) { const price = amountFor(row); const paidCharges = charges.filter((charge) => charge.kind === "membership" && charge.subscription_id === row.id); for (const charge of paidCharges.length ? paidCharges : [{ reference: row.id, occurred_at: row.created_at }]) extras.push({ id: `${row.id}:${charge.reference}`, item_type: "business_membership", item_id: row.plan_slug, ...price, created_at: charge.occurred_at, title: `${String(row.plan_slug).replaceAll("-", " ")} membership`, slug: null, href: "/pricing", description: `${row.billing_interval === "annually" ? "Annual" : "Monthly"} business support · ${row.subscription_status}`, formats: [], download_url: null }); }
  for (const row of skillRows) { const price = amountFor(row); extras.push({ id: row.id, item_type: "skill_to_business", item_id: row.id, ...price, created_at: row.created_at, title: "Skill to Business", slug: null, href: "/skill-to-business", description: "Programme payment", formats: [], download_url: null }); }
  for (const row of consultationRows) { const price = amountFor(row); const relation = row.consultation_services as unknown as { name?: string } | { name?: string }[] | null; const service = Array.isArray(relation) ? relation[0] : relation; extras.push({ id: row.id, item_type: "consultation", item_id: row.service_id, ...price, created_at: row.created_at, title: service?.name || "Consultation", slug: null, href: "/consultations", description: row.start_at ? `Booked for ${new Date(row.start_at).toLocaleDateString("en-GB")}` : "Consultation booking", formats: [], download_url: null }); }
  for (const row of eventRows) { const relation = row.events as unknown as { title?: string; slug?: string } | { title?: string; slug?: string }[] | null; const event = Array.isArray(relation) ? relation[0] : relation; extras.push({ id: row.id, item_type: "event", item_id: row.event_id, amount: Number(row.amount_paid || 0), currency: row.currency || "NGN", created_at: row.created_at, title: event?.title || "Event registration", slug: event?.slug || null, href: event?.slug ? `/events/${event.slug}` : "/events", description: "Paid event registration", formats: [], download_url: null }); }

  const items = [...content, ...extras].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const spent: Record<string, number> = {};
  for (const row of contentRows) { const code = (row.currency || "NGN").toUpperCase(); spent[code] = (spent[code] || 0) + Number(row.amount || 0); }
  for (const item of extras) spent[item.currency] = (spent[item.currency] || 0) + item.amount;
  return NextResponse.json({ ok: true, items, spent, purchaseCount: contentRows.length + extras.length });
}
