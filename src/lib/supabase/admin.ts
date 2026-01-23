import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase env vars. Check .env.local");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
  },
});
