"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const ICON_PATHS: Record<string, string> = {
  calculator: "M8.25 3v1.5M4.5 8.25h15M5.25 21h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21zM9.75 15h.008v.008H9.75V15zm0 3h.008v.008H9.75V18zm3-3h.008v.008H12.75V15zm0 3h.008v.008H12.75V18zm3-3h.008v.008H15.75V15zm0 3h.008v.008H15.75V18zM9.75 11.25h4.5",
  tracker: "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941",
  invoice: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  inventory: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z",
  reach: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46",
  "business-helper": "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
  "business-health-check": "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  "business-structure": "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  "customer-support": "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
};

function ToolIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[iconKey] || ICON_PATHS["business-helper"]} />
    </svg>
  );
}

const TOOLS = [
  {key:"calculator",href:"/tools/calculator",badge:"Premium",title:"Startup Cost & Break-Even Calculator",desc:"Know exactly how much it costs to launch. Set the right price. Find your break-even point before you spend a single dollar.",detail:"Startup costs · Pricing · Break-even · Funding tracker",gated:true},
  {key:"tracker",href:"/tools/tracker",badge:"Premium",title:"Profit & Cashflow Tracker",desc:"Track every dollar in and out. Monthly summaries, annual overview, and cashflow forecasting so you always know where your business stands.",detail:"Monthly tracking · Annual view · Cashflow forecast",gated:true},
  {key:"invoice",href:"/tools/invoice",badge:"Premium",title:"Invoice Manager",desc:"Create professional invoices, track who has paid and who has not, and send payment reminders directly to clients via WhatsApp or email.",detail:"Invoice creation · Payment tracking · WhatsApp reminders",gated:true},
  {key:"inventory",href:"/tools/inventory",badge:"Premium",title:"Inventory Manager",desc:"Track your stock levels in real time. Get low stock alerts before you run out. Works for both product and service businesses.",detail:"Stock tracking · Low stock alerts · Service availability",gated:true},
  {key:"reach",href:"/tools/reach",badge:"Premium",title:"Reach & Growth Planner",desc:"A full growth toolkit; content ideas for every platform, an ad campaign tracker, a social media calendar, and a practical marketing guide.",detail:"Content ideas · Ad planner · Social calendar · Growth guide",gated:true},
  {key:"business-helper",href:"/tools/business-helper",badge:"Free",title:"Business Helper",desc:"Tell us what is happening in your business. Get a structured diagnostic report with a Business Health Score and clear next steps powered by AI.",detail:"AI diagnostic · Health score · Action plan",gated:false},
  {key:"business-health-check",href:"/tools/business-health-check",badge:"Free",title:"Operational Health Self-Audit",desc:"Work through the foundational things every business must have before chasing growth. Check off what you have. See where the gaps are.",detail:"36 checkpoints · 6 categories · Progress tracking",gated:false},
  {key:"business-structure",href:"/tools/business-structure",badge:"Free",title:"Business Structure Template",desc:"Map out your business structure step by step. Define roles, responsibilities, decision making, and communication flow.",detail:"Role mapping · Decision flow · Downloadable output",gated:false},
  {key:"customer-support",href:"/tools/customer-support",badge:"Free",title:"Customer Service Guide",desc:"A practical guide to handling client communication, complaints, and retention.",detail:"Response scripts · Complaint handling · Retention",gated:false},
];

export default function ToolsPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const premium = TOOLS.filter(t => t.gated);
  const free = TOOLS.filter(t => !t.gated);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        .tr{font-family:'DM Sans',sans-serif;min-height:100vh;background:#0c1a1b;color:#fff}
        .hero{position:relative;padding:80px 24px 72px;overflow:hidden;text-align:center}
        .orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
        .orb-a{width:520px;height:520px;background:radial-gradient(circle,rgba(80,124,128,.55) 0%,transparent 70%);top:-180px;left:50%;transform:translateX(-50%);animation:orbA 8s ease-in-out infinite}
        .orb-b{width:320px;height:320px;background:radial-gradient(circle,rgba(58,92,96,.4) 0%,transparent 70%);bottom:-80px;right:10%;animation:orbB 11s ease-in-out infinite reverse}
        @keyframes orbA{0%,100%{transform:translateY(0) translateX(-50%)}50%{transform:translateY(-28px) translateX(-50%)}}
        @keyframes orbB{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        .eyebrow{font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#6a9ea3;margin-bottom:18px;position:relative}
        .htitle{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(36px,6vw,66px);font-weight:800;line-height:1.08;letter-spacing:-1.5px;position:relative;margin:0 auto;max-width:780px}
        .acc{background:linear-gradient(135deg,#6ab8bd 0%,#507c80 60%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hsub{margin:22px auto 0;max-width:540px;font-size:16px;line-height:1.75;color:rgba(255,255,255,.52);position:relative}
        .statbar{display:flex;align-items:center;justify-content:center;gap:32px;margin-top:44px;position:relative;flex-wrap:wrap}
        .statnum{font-family:'Bricolage Grotesque',sans-serif;font-size:28px;font-weight:800;color:#fff}
        .statlabel{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;text-align:center}
        .sdiv{width:1px;height:36px;background:rgba(255,255,255,.1)}
        .gsec{padding:0 20px 80px;max-width:1160px;margin:0 auto}
        .sec-group{margin-bottom:44px}
        .slabel{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.28);margin-bottom:20px;padding-left:4px}
        .tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
        .tc{position:relative;border-radius:20px;padding:28px;cursor:pointer;text-decoration:none;display:block;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);backdrop-filter:blur(8px);transition:transform .28s cubic-bezier(.22,.68,0,1.2),border-color .28s,background .28s,box-shadow .28s;opacity:0;transform:translateY(24px)}
        .tc.vis{opacity:1;transform:translateY(0);transition:opacity .55s ease,transform .55s cubic-bezier(.22,.68,0,1.2),border-color .28s,background .28s,box-shadow .28s}
        .tc:hover{transform:translateY(-5px) scale(1.015);border-color:rgba(80,124,128,.5);background:rgba(80,124,128,.08);box-shadow:0 20px 60px rgba(0,0,0,.35),0 0 0 1px rgba(80,124,128,.2)}
        .tc.prem{background:linear-gradient(145deg,rgba(58,92,96,.18) 0%,rgba(80,124,128,.08) 100%);border-color:rgba(80,124,128,.25)}
        .tc.prem::before{content:'';position:absolute;top:0;left:20px;right:20px;height:1px;background:linear-gradient(90deg,transparent,rgba(80,124,128,.8),transparent)}
        .tc.prem:hover{border-color:rgba(106,158,163,.6);box-shadow:0 20px 60px rgba(0,0,0,.4),0 0 40px rgba(80,124,128,.15)}
        .ctop{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
        .cicon{width:50px;height:50px;background:rgba(255,255,255,.07);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform .3s ease}
        .tc:hover .cicon{transform:scale(1.12) rotate(-4deg)}
        .cbadge{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 10px;border-radius:20px}
        .bfree{background:rgba(46,160,67,.15);color:#4cba6f;border:1px solid rgba(46,160,67,.25)}
        .bprem{background:rgba(80,124,128,.25);color:#7ec8cd;border:1px solid rgba(80,124,128,.4);animation:pp 3s ease-in-out infinite}
        @keyframes pp{0%,100%{box-shadow:none}50%{box-shadow:0 0 10px rgba(80,124,128,.3)}}
        .ctitle{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:10px;letter-spacing:-.3px}
        .cdesc{font-size:14px;line-height:1.7;color:rgba(255,255,255,.48);margin-bottom:18px}
        .cdetail{font-size:11px;color:rgba(80,124,128,.8);font-weight:600;letter-spacing:.5px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)}
        .carrow{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:rgba(255,255,255,.25);transition:color .2s,gap .2s}
        .tc:hover .carrow{color:#7ec8cd;gap:10px}
        .bcta{margin:0 auto;max-width:1160px;padding:0 20px 80px}
        .ctacard{border-radius:24px;padding:40px 44px;background:linear-gradient(135deg,rgba(58,92,96,.35) 0%,rgba(15,38,39,.6) 100%);border:1px solid rgba(80,124,128,.25);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;position:relative;overflow:hidden}
        .ctacard::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(80,124,128,.6),transparent)}
        .ctatitle{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.3px}
        .ctasub{font-size:14px;color:rgba(255,255,255,.45);line-height:1.6;max-width:480px}
        .ctabtn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:12px;background:#507c80;color:#fff;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;transition:background .2s,transform .2s;flex-shrink:0}
        .ctabtn:hover{background:#3a5c60;transform:translateY(-2px)}
        @media(max-width:640px){.hero{padding:60px 20px 52px}.tgrid{grid-template-columns:1fr}.ctacard{padding:28px 22px}.statbar{gap:20px}}
      `}</style>
      <div className="tr">
        <div className="hero">
          <div className="orb orb-a"/>
          <div className="orb orb-b"/>
          <p className="eyebrow">Prowess Digital Solutions &nbsp;·&nbsp; Business Tools</p>
          <h1 className="htitle">Everything your business<br/>needs, <span className="acc">in one place</span></h1>
          <p className="hsub">Nine tools built for African entrepreneurs. From startup planning to invoicing, stock management, and growth; the right tool for every stage.</p>
          <div className="statbar">
            <div><div className="statnum">9</div><div className="statlabel">Business tools</div></div>
            <div className="sdiv"/>
            <div><div className="statnum">54</div><div className="statlabel">African currencies</div></div>
            <div className="sdiv"/>
            <div><div className="statnum">4</div><div className="statlabel">Free tools</div></div>
          </div>
        </div>

        <div className="gsec">
          <div className="sec-group">
            <p className="slabel">Premium; Access Code Required</p>
            <div className="tgrid">
              {premium.map((tool, i) => (
                <Link key={tool.key} href={tool.href} className={`tc prem ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${i * 75}ms` : "0ms" }}>
                  <div className="ctop">
                    <div className="cicon"><ToolIcon iconKey={tool.key} /></div>
                    <span className="cbadge bprem">{tool.badge}</span>
                  </div>
                  <div className="ctitle">{tool.title}</div>
                  <div className="cdesc">{tool.desc}</div>
                  <div className="cdetail">{tool.detail}</div>
                  <div className="carrow">Open tool <span>→</span></div>
                </Link>
              ))}
            </div>
          </div>

          <div className="sec-group">
            <p className="slabel">Free; No Code Needed</p>
            <div className="tgrid">
              {free.map((tool, i) => (
                <Link key={tool.key} href={tool.href} className={`tc ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${(i + 5) * 75}ms` : "0ms" }}>
                  <div className="ctop">
                    <div className="cicon"><ToolIcon iconKey={tool.key} /></div>
                    <span className="cbadge bfree">{tool.badge}</span>
                  </div>
                  <div className="ctitle">{tool.title}</div>
                  <div className="cdesc">{tool.desc}</div>
                  <div className="cdetail">{tool.detail}</div>
                  <div className="carrow">Open tool <span>→</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bcta">
          <div className="ctacard">
            <div>
              <div className="ctatitle">Need a Premium access code?</div>
              <div className="ctasub">The five premium tools are available to Prowess Digital Solutions clients. Reach out to get your code and unlock the full suite.</div>
            </div>
            <a href="/contact" className="ctabtn">Get access →</a>
          </div>
        </div>
      </div>
    </>
  );
}