import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_PIN)
    return NextResponse.json({ error: "ADMIN_PIN not configured" }, { status: 500 });

  if (password === process.env.ADMIN_PIN)
    return NextResponse.json({ success: true, token: process.env.ADMIN_PIN });

  return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
}
