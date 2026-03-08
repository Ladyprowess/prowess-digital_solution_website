"use client";
import Link from "next/link";

const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";

const TOOLS=[
  {key:"calculator",href:"/tools/calculator",icon:"🧮",title:"Startup Cost & Break-Even Calculator",desc:"Plan every cost before you launch. Calculate your break-even point, set prices, and know exactly how much funding you need.",badge:"Access Required"},
  {key:"tracker",href:"/tools/tracker",icon:"📊",title:"Profit & Cashflow Tracker",desc:"Track every naira in and out. Monthly summaries, annual overview, and cashflow forecasting to keep your business healthy.",badge:"Access Required"},
  {key:"customer-support",href:"/tools/customer-support.html",icon:"🤝",title:"Customer Service Guide",desc:"A practical guide to handling client communication, complaints, and retention for African service businesses.",badge:"Free"},
  {key:"business-starter",href:"/tools/business-starter.html",icon:"🚀",title:"Business Starter Checklist",desc:"Step-by-step checklist to register, structure, and launch your business the right way in Nigeria.",badge:"Free"},
];

export default function ToolsPage(){
  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
      <div style={{background:DARK,padding:"20px 28px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.5)",letterSpacing:1.4,textTransform:"uppercase",marginBottom:4}}>Prowess Digital Solutions</div>
        <div style={{fontSize:26,fontWeight:900,color:W}}>Business Tools</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginTop:4}}>Built for African entrepreneurs. Use these tools to start, price, and track your business.</div>
      </div>
      <div style={{padding:"28px",maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
          {TOOLS.map(t=>(
            <Link key={t.key} href={t.href} style={{textDecoration:"none"}}>
              <div style={{background:W,borderRadius:14,padding:"22px 24px",border:`1px solid ${MGRAY}`,boxShadow:"0 1px 6px rgba(58,92,96,.08)",cursor:"pointer",transition:"transform .15s,box-shadow .15s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 4px 18px rgba(58,92,96,.15)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 1px 6px rgba(58,92,96,.08)";(e.currentTarget as HTMLElement).style.transform="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{fontSize:32}}>{t.icon}</div>
                  <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:t.badge==="Free"?"#e8f5e9":LITE,color:t.badge==="Free"?"#2e7d32":B}}>{t.badge}</span>
                </div>
                <div style={{fontSize:15,fontWeight:800,color:DARK,marginBottom:8,lineHeight:1.3}}>{t.title}</div>
                <div style={{fontSize:13,color:MID,lineHeight:1.6}}>{t.desc}</div>
                <div style={{marginTop:14,fontSize:12,fontWeight:700,color:B}}>Open tool →</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{marginTop:28,background:W,borderRadius:12,padding:"18px 22px",border:`1px solid ${MGRAY}`,textAlign:"center"}}>
          <div style={{fontSize:13,color:MID}}>Need an access code for the paid tools? Contact <span style={{fontWeight:700,color:DARK}}>Prowess Digital Solutions</span> to get started.</div>
        </div>
      </div>
    </div>
  );
}
