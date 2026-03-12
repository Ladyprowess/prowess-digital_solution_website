// FILE: src/app/api/create-member/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const CURRENCIES: Record<string, { code: string; symbol: string }> = {
  "Nigeria":        { code: "NGN", symbol: "₦"    },
  "Ghana":          { code: "GHS", symbol: "GH₵"  },
  "Kenya":          { code: "KES", symbol: "KSh"  },
  "South Africa":   { code: "ZAR", symbol: "R"    },
  "Uganda":         { code: "UGX", symbol: "USh"  },
  "Tanzania":       { code: "TZS", symbol: "TSh"  },
  "Rwanda":         { code: "RWF", symbol: "FRw"  },
  "Senegal":        { code: "XOF", symbol: "CFA"  },
  "Cameroon":       { code: "XAF", symbol: "FCFA" },
  "Ethiopia":       { code: "ETB", symbol: "Br"   },
  "Egypt":          { code: "EGP", symbol: "E£"   },
  "United Kingdom": { code: "GBP", symbol: "£"    },
  "United States":  { code: "USD", symbol: "$"    },
  "European Union": { code: "EUR", symbol: "€"    },
};

export async function POST(req: NextRequest) {
  const {
    fullName, email, password, jobTitle, role, managed_by,
    country, earns_commission,
  } = await req.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Step 1: Create the auth account
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      job_title: jobTitle || "",
      role: role || "member",
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Step 2: Derive currency from country
  const currency = country ? (CURRENCIES[country] ?? { code: "USD", symbol: "$" }) : null;
  const initials  = fullName.trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Step 3: Update the profile row
  await supabaseAdmin.from("profiles").update({
    full_name:        fullName,
    job_title:        jobTitle        || null,
    role:             role            || "member",
    avatar_initials:  initials,
    managed_by:       managed_by      || null,
    country:          country         || null,
    currency_code:    currency?.code  || null,
    currency_symbol:  currency?.symbol || null,
    earns_commission: earns_commission ?? false,
  }).eq("id", authData.user.id);

  return NextResponse.json({ success: true });
}