import puppeteer from "puppeteer";
import { NextResponse } from "next/server";

type ReportSection = {
  heading: string;
  paragraphs: string[];
};

type Result = {
  reportId?: string;
  generatedAt?: string;
  healthScore: number;
  healthLabel: "Strong" | "Fair" | "Needs attention" | "Critical";
  scoreNote: string;
  reportTitle: string;
  sections: ReportSection[];
  disclaimer: string;
};

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { result } = await req.json();

    const html = `
    <html>
    <head>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 60px;
        color: #1f2937;
        line-height: 1.7;
      }
    
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40px;
      }
    
      .brand {
        font-size: 26px;
        font-weight: 700;
        color: #1f2937;
      }
    
      .subtitle {
        font-size: 14px;
        color: #6b7280;
      }
    
      .divider {
        height: 1px;
        background: #e5e7eb;
        margin: 25px 0 40px;
      }
    
      .score-circle {
        width: 110px;
        height: 110px;
        border-radius: 999px;
        border: 8px solid #507c80;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 700;
        color: #507c80;
      }
    
      h1 {
        font-size: 24px;
        margin-bottom: 16px;
      }
    
      h2 {
        font-size: 18px;
        margin-top: 40px;
        margin-bottom: 10px;
        font-weight: 600;
      }
    
      p {
        margin-bottom: 12px;
        text-align: justify;
      }
    
      ul {
        margin-left: 20px;
        margin-top: 10px;
      }
    
      li {
        margin-bottom: 6px;
      }
    
    </style>
    </head>
    
    <body>
    
    <div class="header">
      <div>
        <div class="brand">Prowess Digital Solutions</div>
        <div class="subtitle">Business Diagnostic Report</div>
      </div>
    
      <div class="score-circle">
        ${result.healthScore}%
      </div>
    </div>
    
    <div class="divider"></div>
    
    <h1>${result.reportTitle}</h1>
    
    <p>${result.scoreNote}</p>
    
    ${(result.sections as ReportSection[])
      .map(
        (sec: ReportSection) => `
          <h2>${sec.heading}</h2>
          ${sec.paragraphs.map((p: string) => `<p>${p}</p>`).join("")}
        `
      )
      .join("")}
    
    <h2>Disclaimer</h2>
    <p>${result.disclaimer}</p>
    
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "40px",
        right: "40px",
      },
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          "attachment; filename=Prowess_Business_Diagnostic_Report.pdf",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
