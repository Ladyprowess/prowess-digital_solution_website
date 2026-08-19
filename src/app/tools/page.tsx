"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TOOL_ICON_PATHS } from "@/lib/tools/icons";

type ToolRow = {
  key: string;
  category: "career" | "business";
  title: string;
  description: string;
  detail: string | null;
  icon_key: string;
  badge: string;
  gated: boolean;
  href: string | null;
};

function ToolIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={TOOL_ICON_PATHS[iconKey] || TOOL_ICON_PATHS["business-helper"]} />
    </svg>
  );
}

export default function ToolsPage() {
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<"career" | "business">("career");
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  useEffect(() => {
    async function loadTools() {
      const { data } = await supabase
        .from("tools")
        .select("key, category, title, description, detail, icon_key, badge, gated, href")
        .eq("status", "published")
        .order("position");
      setTools(data || []);
      setLoadingTools(false);
    }
    loadTools();
  }, []);

  const careerTools = tools.filter((t) => t.category === "career");
  const businessTools = tools.filter((t) => t.category === "business");
  const premium = businessTools.filter((t) => t.gated);
  const free = businessTools.filter((t) => !t.gated);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');
        .tr{font-family:'DM Sans',sans-serif;min-height:100vh;background:#0c1a1b;color:#fff}
        .hero{position:relative;padding:80px 24px 56px;overflow:hidden;text-align:center}
        .orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
        .orb-a{width:520px;height:520px;background:radial-gradient(circle,rgba(80,124,128,.55) 0%,transparent 70%);top:-180px;left:50%;transform:translateX(-50%);animation:orbA 8s ease-in-out infinite}
        .orb-b{width:320px;height:320px;background:radial-gradient(circle,rgba(58,92,96,.4) 0%,transparent 70%);bottom:-80px;right:10%;animation:orbB 11s ease-in-out infinite reverse}
        @keyframes orbA{0%,100%{transform:translateY(0) translateX(-50%)}50%{transform:translateY(-28px) translateX(-50%)}}
        @keyframes orbB{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        .eyebrow{font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#6a9ea3;margin-bottom:18px;position:relative}
        .htitle{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(36px,6vw,66px);font-weight:800;line-height:1.08;letter-spacing:-1.5px;position:relative;margin:0 auto;max-width:780px}
        .acc{background:linear-gradient(135deg,#6ab8bd 0%,#507c80 60%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hsub{margin:22px auto 0;max-width:560px;font-size:16px;line-height:1.75;color:rgba(255,255,255,.52);position:relative}
        .catTabs{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:36px;position:relative;flex-wrap:wrap}
        .catTab{padding:13px 30px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:rgba(255,255,255,.62);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s ease;font-family:'DM Sans',sans-serif}
        .catTab.active{background:#507c80;border-color:#507c80;color:#fff;box-shadow:0 8px 24px rgba(80,124,128,.35)}
        .catTab:hover:not(.active){border-color:rgba(80,124,128,.5);color:#fff}
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
        .tc.soon{cursor:default;opacity:1;transform:none;border-style:dashed}
        .tc.soon:hover{transform:none;border-color:rgba(255,255,255,.14);background:rgba(255,255,255,.04);box-shadow:none}
        .ctop{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
        .cicon{width:50px;height:50px;background:rgba(255,255,255,.07);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform .3s ease}
        .tc:hover .cicon{transform:scale(1.12) rotate(-4deg)}
        .cbadge{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 10px;border-radius:20px}
        .bfree{background:rgba(46,160,67,.15);color:#4cba6f;border:1px solid rgba(46,160,67,.25)}
        .bprem{background:rgba(80,124,128,.25);color:#7ec8cd;border:1px solid rgba(80,124,128,.4);animation:pp 3s ease-in-out infinite}
        .bsoon{background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.14)}
        @keyframes pp{0%,100%{box-shadow:none}50%{box-shadow:0 0 10px rgba(80,124,128,.3)}}
        .ctitle{font-family:'Bricolage Grotesque',sans-serif;font-size:18px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:10px;letter-spacing:-.3px}
        .cdesc{font-size:14px;line-height:1.7;color:rgba(255,255,255,.48);margin-bottom:18px}
        .cdetail{font-size:11px;color:rgba(80,124,128,.8);font-weight:600;letter-spacing:.5px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)}
        .carrow{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:rgba(255,255,255,.25);transition:color .2s,gap .2s}
        .tc:hover .carrow{color:#7ec8cd;gap:10px}
        .meanwhile{margin-top:8px;font-size:14px;line-height:1.7;color:rgba(255,255,255,.5)}
        .meanwhile a{color:#7ec8cd;font-weight:600;text-decoration:none}
        .meanwhile a:hover{text-decoration:underline}
        .bcta{margin:0 auto;max-width:1160px;padding:0 20px 80px}
        .ctacard{border-radius:24px;padding:40px 44px;background:linear-gradient(135deg,rgba(58,92,96,.35) 0%,rgba(15,38,39,.6) 100%);border:1px solid rgba(80,124,128,.25);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;position:relative;overflow:hidden}
        .ctacard::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(80,124,128,.6),transparent)}
        .ctatitle{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.3px}
        .ctasub{font-size:14px;color:rgba(255,255,255,.45);line-height:1.6;max-width:480px}
        .ctabtn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:12px;background:#507c80;color:#fff;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;transition:background .2s,transform .2s;flex-shrink:0}
        .ctabtn:hover{background:#3a5c60;transform:translateY(-2px)}
        @media(max-width:640px){.hero{padding:60px 20px 52px}.tgrid{grid-template-columns:1fr}.ctacard{padding:28px 22px}.catTabs{gap:8px}.catTab{padding:11px 22px;font-size:13px}}
      `}</style>
      <div className="tr">
        <div className="hero">
          <div className="orb orb-a"/>
          <div className="orb orb-b"/>
          <p className="eyebrow">Prowess Digital Solutions &nbsp;·&nbsp; Tools</p>
          <h1 className="htitle">Tools to help you<br/><span className="acc">move forward</span></h1>
          <p className="hsub">Career tools and business tools, in one place. Pick the ones built for you.</p>
          <div className="catTabs">
            <button type="button" className={`catTab ${category === "career" ? "active" : ""}`} onClick={() => setCategory("career")}>
              Career &amp; CV
            </button>
            <button type="button" className={`catTab ${category === "business" ? "active" : ""}`} onClick={() => setCategory("business")}>
              Business
            </button>
          </div>
        </div>

        <div className="gsec">
          {loadingTools ? (
            <p className="meanwhile">Loading tools…</p>
          ) : category === "career" ? (
            <>
              {careerTools.some((t) => t.href) && (
                <div className="sec-group">
                  <p className="slabel">Available Now</p>
                  <div className="tgrid">
                    {careerTools.filter((t) => t.href).map((tool, i) => (
                      <Link key={tool.key} href={tool.href!} className={`tc ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${i * 75}ms` : "0ms" }}>
                        <div className="ctop">
                          <div className="cicon"><ToolIcon iconKey={tool.icon_key} /></div>
                          <span className="cbadge bfree">{tool.badge}</span>
                        </div>
                        <div className="ctitle">{tool.title}</div>
                        <div className="cdesc">{tool.description}</div>
                        {tool.detail && <div className="cdetail">{tool.detail}</div>}
                        <div className="carrow">Open tool <span>→</span></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {careerTools.some((t) => !t.href) && (
                <div className="sec-group">
                  <p className="slabel">Coming Soon</p>
                  <div className="tgrid">
                    {careerTools.filter((t) => !t.href).map((tool, i) => (
                      <div key={tool.key} className={`tc soon ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${i * 75}ms` : "0ms" }}>
                        <div className="ctop">
                          <div className="cicon"><ToolIcon iconKey={tool.icon_key} /></div>
                          <span className="cbadge bsoon">Coming Soon</span>
                        </div>
                        <div className="ctitle">{tool.title}</div>
                        <div className="cdesc">{tool.description}</div>
                      </div>
                    ))}
                  </div>
                  <p className="meanwhile">
                    While these are being built, explore <Link href="/career-paths">Career Paths</Link>, <Link href="/learn">Learn</Link>, or <Link href="/jobs">Jobs</Link>.
                  </p>
                </div>
              )}

              {careerTools.length === 0 && (
                <p className="meanwhile">Career tools are on the way. In the meantime, explore <Link href="/career-paths">Career Paths</Link>, <Link href="/learn">Learn</Link>, or <Link href="/jobs">Jobs</Link>.</p>
              )}
            </>
          ) : (
            <>
              {businessTools.length === 0 && (
                <p className="meanwhile">Business tools are being updated. Check back shortly.</p>
              )}
              {premium.length > 0 && (
                <div className="sec-group">
                  <p className="slabel">Premium; Access Code Required</p>
                  <div className="tgrid">
                    {premium.map((tool, i) => (
                      <Link key={tool.key} href={tool.href!} className={`tc prem ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${i * 75}ms` : "0ms" }}>
                        <div className="ctop">
                          <div className="cicon"><ToolIcon iconKey={tool.icon_key} /></div>
                          <span className="cbadge bprem">{tool.badge}</span>
                        </div>
                        <div className="ctitle">{tool.title}</div>
                        <div className="cdesc">{tool.description}</div>
                        {tool.detail && <div className="cdetail">{tool.detail}</div>}
                        <div className="carrow">Open tool <span>→</span></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {free.length > 0 && (
                <div className="sec-group">
                  <p className="slabel">Free; No Code Needed</p>
                  <div className="tgrid">
                    {free.map((tool, i) => (
                      <Link key={tool.key} href={tool.href!} className={`tc ${visible ? "vis" : ""}`} style={{ transitionDelay: visible ? `${(i + 5) * 75}ms` : "0ms" }}>
                        <div className="ctop">
                          <div className="cicon"><ToolIcon iconKey={tool.icon_key} /></div>
                          <span className="cbadge bfree">{tool.badge}</span>
                        </div>
                        <div className="ctitle">{tool.title}</div>
                        <div className="cdesc">{tool.description}</div>
                        {tool.detail && <div className="cdetail">{tool.detail}</div>}
                        <div className="carrow">Open tool <span>→</span></div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {category === "business" && (
          <div className="bcta">
            <div className="ctacard">
              <div>
                <div className="ctatitle">Need a Premium access code?</div>
                <div className="ctasub">The five premium tools are available to Prowess Digital Solutions clients. Reach out to get your code and unlock the full suite.</div>
              </div>
              <a href="/contact" className="ctabtn">Get access →</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
