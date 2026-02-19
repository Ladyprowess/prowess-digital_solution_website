import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessType, problem, details } = body;

    const prompt = `
You are a practical business advisor for small Nigerian businesses.

Business type: ${businessType}
Main problem: ${problem}
Details: ${details}

Return JSON with:

healthScore (0-100)
scoreBreakdown (3 short reasons)
priorityFocus (3 items)
diagnosis
why
quickWins (3 items)
plan (3 items)
track (3 items)
disclaimer

Use simple British English.
`;

    const response = await openai.responses.create({
      model: "gpt-5.2",
      input: prompt,
    });

    const text = response.output_text;

    // Try parsing JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid format." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate solution." },
      { status: 500 }
    );
  }
}