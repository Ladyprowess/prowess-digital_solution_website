import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const {
    title,
    slug,
    category,
    business_size,
    challenge,
    solution,
    image_url,
    is_published = true,
  } = body;

  if (!title || !slug || !category || !business_size || !challenge) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  const { error } = await supabaseAdmin.from("case_studies").insert([
    {
      title,
      slug,
      category,
      business_size,
      challenge,
      solution,
      image_url,
      is_published,
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
