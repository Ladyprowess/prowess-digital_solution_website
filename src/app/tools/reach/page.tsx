"use client";
import { useState, useEffect, useCallback } from "react";

const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";
const mkid=()=>Math.random().toString(36).slice(2,9);
const num=(v:unknown)=>{const x=parseFloat(String(v||"").replace(/,/g,""));return isNaN(x)?0:x;};
const fmt=(v:unknown)=>Math.round(num(v)).toLocaleString("en")||"0";
const todayStr=()=>new Date().toISOString().split("T")[0];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const card:React.CSSProperties={background:W,borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(58,92,96,.10)",border:`1.5px solid ${MGRAY}`,marginBottom:14};

// ── Types ─────────────────────────────────────────────────────────────────
interface Campaign{id:string;name:string;platform:string;budget:string;startDate:string;endDate:string;goal:string;audience:string;status:"planning"|"active"|"ended";spend:string;reach:string;clicks:string;conversions:string;}
interface CalPost{id:string;date:string;platform:string;type:string;caption:string;notes:string;}

const blankCampaign=():Campaign=>({id:mkid(),name:"",platform:"Instagram",budget:"",startDate:todayStr(),endDate:"",goal:"",audience:"",status:"planning",spend:"",reach:"",clicks:"",conversions:""});

// ── Shared UI ─────────────────────────────────────────────────────────────
function FI({label,val,set,ph="",type="text"}:{label?:string,val:unknown,set:(v:string)=>void,ph?:string,type?:string}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:10}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>}
    <input type={type} value={String(val||"")} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)}
      style={{padding:"8px 11px",border:`1.5px solid ${f?B:MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",background:W,color:DARK}}/>
  </div>;
}
function FSel({label,val,set,opts}:{label?:string,val:string,set:(v:string)=>void,opts:string[]}){
  return <div style={{marginBottom:10}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>}
    <select value={val} onChange={e=>set(e.target.value)} style={{padding:"8px 11px",border:`1.5px solid ${MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",background:W,color:DARK}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>;
}

// ── Growth Guide Tab ──────────────────────────────────────────────────────
const GUIDE_SECTIONS=[
  {icon:"🔧",title:"Fix Your Profile First",content:"Before spending a single naira on ads, your profile must do the work. Your bio should tell visitors exactly who you help and what you offer in one sentence. Use a real photo or a clear logo. Put your WhatsApp or contact link where anyone can tap it. Your most recent post should be something a stranger would trust. If your page looks abandoned or confusing, ads will just bring people to a dead end."},
  {icon:"📅",title:"Post Consistently",content:"Consistency beats virality. One post a day that speaks directly to your customer is more powerful than ten random posts a week. Plan your content around your customer's real problems. Show results, show process, show yourself. For product businesses, show the product being used. For service businesses, show the transformation. People buy from who they trust, and trust is built by showing up regularly."},
  {icon:"💬",title:"Engage Before You Sell",content:"Reply to every comment and DM within 24 hours. Ask questions in your captions to invite responses. Comment meaningfully on posts from your target audience. Join conversations in groups where your ideal client is active. When you engage first, the algorithm rewards you and customers remember you. Most African business owners are too busy to do this consistently; that gap is your advantage."},
  {icon:"🤝",title:"Build a Referral System",content:"Your best marketing is a satisfied client who tells someone. Make referrals easy and worth doing. After every job, follow up and ask if they know anyone who needs the same service. Consider a simple referral reward; a small discount or gift. Post client testimonials regularly. One real testimonial from someone local and recognisable is worth more than fifty generic quotes. Build a system, not a hope."},
  {icon:"📊",title:"Track What is Working",content:"You cannot grow what you do not measure. Every week, write down your total reach, your DM conversations started, your leads, and your conversions. Compare week by week. If something worked; a post format, a caption style, a time of day; do more of it. If something did not; drop it. Most business owners run on feel. Data gives you an edge."},
  {icon:"🔗",title:"Never Lose a Lead",content:"Every person who messages you is a warm lead. Save their contact immediately. Use a simple WhatsApp broadcast list to follow up on people who expressed interest but did not buy. A polite message two weeks later; 'Just checking in, do you still need this?'; converts more than a hundred cold posts. Build your customer list as if your business depends on it. Because it does."},
];

function GuideTab(){
  const [open,setOpen]=useState<number|null>(null);
  return <div>
    <div style={{...card,background:"linear-gradient(135deg,#0c1a1b,#1a3a3e)",border:"none",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(80,124,128,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.08) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:W,marginBottom:6}}>Six Things That Actually Grow African Businesses</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:1.6}}>These are not general tips. They are actions built on how customers in this market discover, trust, and buy.</div>
      </div>
    </div>
    {GUIDE_SECTIONS.map((s,i)=><div key={i} style={{...card,cursor:"pointer",marginBottom:10}} onClick={()=>setOpen(open===i?null:i)}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:10,background:LITE,border:`1.5px solid ${MID}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
          <span style={{fontWeight:800,fontSize:14,color:DARK}}>{s.title}</span>
        </div>
        <span style={{color:MID,fontWeight:700,fontSize:16,flexShrink:0}}>{open===i?"▲":"▼"}</span>
      </div>
      {open===i&&<div style={{marginTop:14,paddingTop:14,borderTop:`1.5px solid ${LGRAY}`,fontSize:14,color:DARK,lineHeight:1.8}}>{s.content}</div>}
    </div>)}
  </div>;
}

// ── Content Ideas Tab ──────────────────────────────────────────────────────
const CONTENT_IDEAS:{[k:string]:{icon:string,ideas:{type:string,caption:string}[]}}={
  Instagram:{icon:"📸",ideas:[
    {type:"Before & After",caption:"This is what [service/product] does for my clients. Before on the left, after on the right. If you want this result, send me a message."},
    {type:"Behind the Scenes",caption:"A day in the life of running [your business]. Not glamorous, but this is what it takes to give you the best results."},
    {type:"Client Testimonial",caption:"[Client name] came to me with [problem]. Here is what they said after. Their words, not mine."},
    {type:"Educational Tip",caption:"Most people get this wrong when it comes to [topic]. Here is the right way to do it."},
    {type:"Direct Offer",caption:"If you are in [city] and need [service/product], I am available this week. DM me or tap the link in bio. Serious inquiries only."},
  ]},
  Facebook:{icon:"👥",ideas:[
    {type:"Community Post",caption:"Question for my [city] community: what is the biggest challenge you face when it comes to [relevant topic]? Drop your answer below."},
    {type:"Product/Service Highlight",caption:"A lot of people do not know we offer [service]. Here is exactly what it includes and who it is for."},
    {type:"Social Proof",caption:"We have served [X] clients in [city] this year. Here is what some of them are saying."},
    {type:"Helpful List",caption:"5 things every [target customer] should know about [topic]. Save this for later."},
    {type:"Promotion",caption:"This week only: [offer]. First [X] people to message us get [bonus]. Do not wait."},
  ]},
  WhatsApp:{icon:"💬",ideas:[
    {type:"Status Update",caption:"Available this week for [service]. Limited slots. Message me directly to book."},
    {type:"Broadcast Follow-Up",caption:"Hi [Name], just checking in. We spoke a while back about [topic]. Are you still looking for help with that?"},
    {type:"New Product Alert",caption:"New in: [product name]. [Price]. Limited stock. Reply to this message to order."},
    {type:"Referral Ask",caption:"If you know anyone who needs [service/product], I would appreciate the referral. I always take care of people who come through my existing clients."},
    {type:"Quick Testimonial Share",caption:"A client just sent me this message. If you want the same result, reach out today."},
  ]},
  TikTok:{icon:"🎵",ideas:[
    {type:"Process Video",caption:"Watch how I do [process] from start to finish. Most people have no idea how much goes into this."},
    {type:"Myth Busting",caption:"Everyone says [common belief]. Here is why that is wrong for your situation."},
    {type:"Day in the Life",caption:"A real day running [type of business] in Nigeria. No filters."},
    {type:"Product Demo",caption:"This is [product]. Here is what it does, who it is for, and how much it costs. Link in bio."},
    {type:"Quick Tip",caption:"One thing I wish I knew when I started [business type]. Watch till the end."},
  ]},
  "Google Business":{icon:"🗺",ideas:[
    {type:"Update Post",caption:"We are open [days and hours]. Located at [address]. Call or WhatsApp [number] to book or order."},
    {type:"Offer Post",caption:"Special this week: [offer]. Visit us at [address] or call [number] to find out more."},
    {type:"New Service",caption:"We now offer [service]. [Brief description]. Contact us to learn more."},
    {type:"Photo Post",caption:"New photos of our [workspace/products/team]. Come see us in person at [address]."},
    {type:"Event Post",caption:"We are hosting [event] on [date] at [location]. Everyone is welcome."},
  ]},
  YouTube:{icon:"▶",ideas:[
    {type:"How-To Video",caption:"How to [achieve outcome] step by step. I break this down in under 10 minutes."},
    {type:"Business Story",caption:"How I started [business type] in Nigeria with [amount/resource]. The real story."},
    {type:"Product Review / Demo",caption:"Honest review of [product/service]. What works, what does not, and whether it is worth it."},
    {type:"Client Case Study",caption:"How [client type] went from [problem] to [result] working with us."},
    {type:"FAQ Video",caption:"The five questions I get asked most about [topic]. Answering them all here."},
  ]},
};

function ContentTab(){
  const [platform,setPlatform]=useState("Instagram");
  const [copied,setCopied]=useState<number|null>(null);
  const pl=CONTENT_IDEAS[platform];
  const copyCaption=(text:string,i:number)=>{navigator.clipboard.writeText(text).then(()=>{setCopied(i);setTimeout(()=>setCopied(null),1800);}).catch(()=>{});};
  return <div>
    <div style={{...card,background:"linear-gradient(135deg,#0c1a1b,#1a3a3e)",border:"none",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(80,124,128,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.08) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:W,marginBottom:6}}>Content Ideas by Platform</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>Pick a platform, copy the caption, and customise it for your business.</div>
      </div>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
      {Object.keys(CONTENT_IDEAS).map(p=><button key={p} onClick={()=>setPlatform(p)} style={{padding:"7px 14px",borderRadius:99,border:`1.5px solid ${platform===p?B:MGRAY}`,background:platform===p?B:W,color:platform===p?W:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>{CONTENT_IDEAS[p].icon} {p}</button>)}
    </div>
    <div style={{display:"grid",gap:12}}>
      {pl.ideas.map((idea,i)=><div key={i} style={card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{padding:"3px 10px",borderRadius:99,background:LITE,color:B,fontSize:11,fontWeight:700,border:`1px solid ${MID}`}}>{idea.type}</span>
          <button onClick={()=>copyCaption(idea.caption,i)} style={{padding:"5px 12px",background:copied===i?"#e8f5e9":LGRAY,border:`1.5px solid ${copied===i?"#a5d6a7":MGRAY}`,borderRadius:7,color:copied===i?"#2e7d32":MID,fontSize:12,fontWeight:700,cursor:"pointer"}}>{copied===i?"✓ Copied":"Copy Caption"}</button>
        </div>
        <p style={{fontSize:13,color:DARK,lineHeight:1.8,margin:0,fontStyle:"italic"}}>"{idea.caption}"</p>
      </div>)}
    </div>
  </div>;
}

// ── Ad Planner Tab ────────────────────────────────────────────────────────
const BUDGET_GUIDE=[
  {range:"Under ₦5,000",recs:[{platform:"WhatsApp",tip:"Run a broadcast campaign to your existing contacts. No ad spend needed; just a good message."},{platform:"Instagram/Facebook",tip:"Boost one high-performing post for ₦2,000. Target women or men in your city, age 22 to 40."}]},
  {range:"₦5,000 to ₦20,000",recs:[{platform:"Facebook/Instagram",tip:"Run a traffic or message campaign. Set ₦1,000 per day for 10 to 14 days. Target by city and interest."},{platform:"Google Business",tip:"Make sure your profile is fully set up; free and highly effective at this budget level."}]},
  {range:"₦20,000 to ₦50,000",recs:[{platform:"Facebook/Instagram",tip:"Split between a brand awareness campaign and a direct conversion campaign. Test two ad creatives."},{platform:"TikTok",tip:"Boost 2 to 3 videos with strong hooks. Test ₦5,000 per video for 5 days."}]},
  {range:"₦50,000 and above",recs:[{platform:"Facebook/Instagram",tip:"Run a full funnel: awareness, retargeting, and conversion campaigns simultaneously."},{platform:"Google Ads",tip:"Search ads for people looking for your service by keyword in your city."}]},
];

const PLATFORMS=["Instagram","Facebook","TikTok","WhatsApp","Google Ads","YouTube","Twitter/X","Other"];
const STATUSES=["planning","active","ended"];

function AdPlannerTab({campaigns,setCampaigns}:{campaigns:Campaign[],setCampaigns:(c:Campaign[])=>void}){
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState<Campaign|null>(null);
  const [form,setForm]=useState<Campaign>(blankCampaign);
  const [budgetGuide,setBudgetGuide]=useState<number|null>(null);
  const u=(f:keyof Campaign,v:string)=>setForm(p=>({...p,[f]:v}));
  const openNew=()=>{setForm(blankCampaign());setEditing(null);setAdding(true);};
  const openEdit=(c:Campaign)=>{setForm(c);setEditing(c);setAdding(true);};
  const saveCampaign=()=>{
    if(!form.name.trim()){alert("Please enter a campaign name.");return;}
    const n=editing?campaigns.map(c=>c.id===editing.id?form:c):[...campaigns,form];
    setCampaigns(n);setAdding(false);setEditing(null);
  };
  const del=(id:string)=>{if(window.confirm("Delete this campaign?"))setCampaigns(campaigns.filter(c=>c.id!==id));};
  const totalSpend=campaigns.reduce((a,c)=>a+num(c.spend),0);
  const totalReach=campaigns.reduce((a,c)=>a+num(c.reach),0);
  const totalConversions=campaigns.reduce((a,c)=>a+num(c.conversions),0);
  return <div>
    <div style={{...card,background:"linear-gradient(135deg,#0c1a1b,#1a3a3e)",border:"none",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(80,124,128,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.08) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:W,marginBottom:6}}>Ad Planner</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>Budget guide for Nigerian businesses, plus a tracker for your active and past campaigns.</div>
      </div>
    </div>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Budget Guide; Where to Put Your Money</div>
      {BUDGET_GUIDE.map((g,i)=><div key={i} style={{...card,marginBottom:10,cursor:"pointer"}} onClick={()=>setBudgetGuide(budgetGuide===i?null:i)}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontWeight:800,fontSize:14,color:DARK}}>{g.range}</span>
          <span style={{color:MID,fontWeight:700}}>{budgetGuide===i?"▲":"▼"}</span>
        </div>
        {budgetGuide===i&&<div style={{marginTop:12,paddingTop:12,borderTop:`1.5px solid ${LGRAY}`,display:"grid",gap:8}}>
          {g.recs.map((r,j)=><div key={j} style={{background:LGRAY,borderRadius:9,padding:"10px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:B,marginBottom:4,textTransform:"uppercase"}}>{r.platform}</div>
            <div style={{fontSize:13,color:DARK,lineHeight:1.7}}>{r.tip}</div>
          </div>)}
        </div>}
      </div>)}
    </div>
    {campaigns.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
      <div style={{background:LITE,borderRadius:10,padding:"12px 14px",border:`1px solid ${MID}`}}><div style={{fontSize:10,fontWeight:700,color:B,textTransform:"uppercase",marginBottom:3}}>Total Spent</div><div style={{fontSize:18,fontWeight:800,color:DARK}}>₦{fmt(totalSpend)}</div></div>
      <div style={{background:LGRAY,borderRadius:10,padding:"12px 14px",border:`1px solid ${MGRAY}`}}><div style={{fontSize:10,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:3}}>Total Reach</div><div style={{fontSize:18,fontWeight:800,color:DARK}}>{fmt(totalReach)}</div></div>
      <div style={{background:"#e8f5e9",borderRadius:10,padding:"12px 14px",border:"1px solid #a5d6a7"}}><div style={{fontSize:10,fontWeight:700,color:"#2e7d32",textTransform:"uppercase",marginBottom:3}}>Total Conversions</div><div style={{fontSize:18,fontWeight:800,color:"#2e7d32"}}>{fmt(totalConversions)}</div></div>
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,textTransform:"uppercase",letterSpacing:.5}}>Your Campaigns</div>
      <button onClick={openNew} style={{padding:"8px 16px",background:B,border:"none",borderRadius:9,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ New Campaign</button>
    </div>
    {adding&&<div style={{...card,border:`2px solid ${B}`}}>
      <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:14}}>{editing?"Edit Campaign":"New Campaign"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FI label="Campaign Name *" val={form.name} set={v=>u("name",v)} ph="e.g. March Instagram Push"/>
        <FSel label="Platform" val={form.platform} set={v=>u("platform",v)} opts={PLATFORMS}/>
        <FI label="Budget (₦)" val={form.budget} set={v=>u("budget",v)} type="number" ph="Total budget"/>
        <FSel label="Status" val={form.status} set={v=>u("status",v as Campaign["status"])} opts={STATUSES}/>
        <FI label="Start Date" val={form.startDate} set={v=>u("startDate",v)} type="date"/>
        <FI label="End Date" val={form.endDate} set={v=>u("endDate",v)} type="date"/>
        <FI label="Goal" val={form.goal} set={v=>u("goal",v)} ph="e.g. Get 50 new leads"/>
        <FI label="Target Audience" val={form.audience} set={v=>u("audience",v)} ph="e.g. Women 25-40 in Lagos"/>
      </div>
      <div style={{fontWeight:700,fontSize:12,color:DARK,marginTop:4,marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>Results (fill as campaign runs)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <FI label="Spend (₦)" val={form.spend} set={v=>u("spend",v)} type="number"/>
        <FI label="Reach" val={form.reach} set={v=>u("reach",v)} type="number"/>
        <FI label="Clicks" val={form.clicks} set={v=>u("clicks",v)} type="number"/>
        <FI label="Conversions" val={form.conversions} set={v=>u("conversions",v)} type="number"/>
      </div>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={saveCampaign} style={{padding:"9px 20px",background:B,border:"none",borderRadius:8,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Campaign</button>
        <button onClick={()=>{setAdding(false);setEditing(null);}} style={{padding:"9px 16px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,color:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>}
    {campaigns.length===0&&!adding?<div style={{textAlign:"center",padding:"40px",color:MID}}><div style={{fontSize:36,marginBottom:10}}>📣</div><div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:6}}>No campaigns yet</div><p style={{fontSize:13}}>Add your first ad campaign to start tracking results.</p></div>:
    campaigns.map(c=>{
      const sc=c.status==="active"?{bg:"#e8f5e9",c:"#2e7d32",b:"#a5d6a7"}:c.status==="ended"?{bg:LGRAY,c:MID,b:MGRAY}:{bg:"#fff7ed",c:"#c2410c",b:"#fed7aa"};
      return <div key={c.id} style={{...card,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:4}}>{c.name}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,background:LITE,color:B,border:`1px solid ${MID}`}}>{c.platform}</span>
              <span style={{padding:"2px 9px",borderRadius:99,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.b}`,textTransform:"capitalize"}}>{c.status}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>openEdit(c)} style={{padding:"5px 12px",background:LITE,border:`1.5px solid ${MID}`,borderRadius:7,color:B,fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>
            <button onClick={()=>del(c.id)} style={{padding:"5px 12px",background:"#fdecea",border:"1.5px solid #f5c6cb",borderRadius:7,color:"#c0392b",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
          </div>
        </div>
        {(c.budget||c.goal||c.audience)&&<div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
          {c.budget&&<div style={{background:LGRAY,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:2}}>Budget</div><div style={{fontSize:13,fontWeight:800,color:DARK}}>₦{fmt(c.budget)}</div></div>}
          {c.spend&&<div style={{background:LGRAY,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:2}}>Spent</div><div style={{fontSize:13,fontWeight:800,color:DARK}}>₦{fmt(c.spend)}</div></div>}
          {c.reach&&<div style={{background:LGRAY,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:2}}>Reach</div><div style={{fontSize:13,fontWeight:800,color:DARK}}>{fmt(c.reach)}</div></div>}
          {c.conversions&&<div style={{background:"#e8f5e9",borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:"#2e7d32",textTransform:"uppercase",marginBottom:2}}>Conversions</div><div style={{fontSize:13,fontWeight:800,color:"#2e7d32"}}>{fmt(c.conversions)}</div></div>}
        </div>}
        {c.goal&&<div style={{marginTop:8,fontSize:12,color:MID}}><b style={{color:DARK}}>Goal:</b> {c.goal}</div>}
        {c.audience&&<div style={{marginTop:4,fontSize:12,color:MID}}><b style={{color:DARK}}>Audience:</b> {c.audience}</div>}
      </div>;
    })}
  </div>;
}

// ── Social Calendar Tab ───────────────────────────────────────────────────
const CALENDAR_PLATFORMS=["Instagram","Facebook","TikTok","WhatsApp","YouTube","Twitter/X","Google Business"];
const POST_TYPES=["Post","Reel / Video","Story","Broadcast","Blog","Event","Promo","Other"];

function CalendarTab({posts,setPosts}:{posts:CalPost[],setPosts:(p:CalPost[])=>void}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [selectedDay,setSelectedDay]=useState<number|null>(null);
  const [form,setForm]=useState<CalPost|null>(null);
  const daysInMonth=new Date(year,month+1,0).getDate();
  const firstDay=new Date(year,month,1).getDay();
  const dateStr=(d:number)=>`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const dayPosts=(d:number)=>posts.filter(p=>p.date===dateStr(d));
  const openDay=(d:number)=>{setSelectedDay(d);setForm({id:mkid(),date:dateStr(d),platform:"Instagram",type:"Post",caption:"",notes:""});};
  const savePost=()=>{if(!form)return;if(!form.caption.trim()){alert("Please add a caption.");return;}setPosts([...posts,form]);setForm(null);setSelectedDay(null);};
  const delPost=(id:string)=>setPosts(posts.filter(p=>p.id!==id));
  const PLATFORM_COLORS:{[k:string]:string}={Instagram:"#e1306c",Facebook:"#1877f2",TikTok:"#010101",WhatsApp:"#25d366",YouTube:"#ff0000","Twitter/X":"#000","Google Business":"#4285f4",Other:MID};
  const totalPosts=posts.filter(p=>p.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length;
  return <div>
    <div style={{...card,background:"linear-gradient(135deg,#0c1a1b,#1a3a3e)",border:"none",marginBottom:18,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(80,124,128,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.08) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:18,fontWeight:800,color:W,marginBottom:6}}>Social Media Calendar</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>Click any day to add a post. Colour coded by platform.</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}} style={{padding:"6px 12px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,cursor:"pointer",fontSize:16,color:DARK}}>‹</button>
        <div style={{fontWeight:800,fontSize:16,color:DARK,minWidth:150,textAlign:"center"}}>{MONTHS[month]} {year}</div>
        <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}} style={{padding:"6px 12px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,cursor:"pointer",fontSize:16,color:DARK}}>›</button>
      </div>
      <div style={{fontSize:13,color:MID,fontWeight:600}}>{totalPosts} post{totalPosts!==1?"s":""} this month</div>
    </div>
    <div style={card}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:700,color:MID,padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const d=i+1;
          const dp=dayPosts(d);
          const isToday=now.getDate()===d&&now.getMonth()===month&&now.getFullYear()===year;
          return <div key={d} onClick={()=>openDay(d)} style={{minHeight:56,background:isToday?LITE:LGRAY,borderRadius:8,padding:"5px 6px",cursor:"pointer",border:`1.5px solid ${isToday?B:MGRAY}`,position:"relative"}}>
            <div style={{fontSize:11,fontWeight:700,color:isToday?B:DARK,marginBottom:3}}>{d}</div>
            {dp.slice(0,3).map((p,j)=><div key={j} style={{fontSize:9,fontWeight:700,padding:"2px 4px",borderRadius:4,background:PLATFORM_COLORS[p.platform]||MID,color:W,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.platform.slice(0,4)}</div>)}
            {dp.length>3&&<div style={{fontSize:9,color:MID}}>+{dp.length-3}</div>}
          </div>;
        })}
      </div>
    </div>
    {selectedDay!==null&&form&&<div style={{...card,border:`2px solid ${B}`}}>
      <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:14}}>Add Post; {SHORT[month]} {selectedDay}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FSel label="Platform" val={form.platform} set={v=>setForm(p=>p?{...p,platform:v}:p)} opts={CALENDAR_PLATFORMS}/>
        <FSel label="Post Type" val={form.type} set={v=>setForm(p=>p?{...p,type:v}:p)} opts={POST_TYPES}/>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>Caption / Content *</label>
        <textarea value={form.caption} onChange={e=>setForm(p=>p?{...p,caption:e.target.value}:p)} placeholder="What will this post say?" rows={3} style={{padding:"9px 11px",border:`1.5px solid ${MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
      </div>
      <FI label="Notes (optional)" val={form.notes} set={v=>setForm(p=>p?{...p,notes:v}:p)} ph="Any production notes"/>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button onClick={savePost} style={{padding:"9px 20px",background:B,border:"none",borderRadius:8,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>Add to Calendar</button>
        <button onClick={()=>{setForm(null);setSelectedDay(null);}} style={{padding:"9px 16px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,color:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>}
    {posts.filter(p=>p.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length>0&&<div style={card}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>This Month's Posts</div>
      {posts.filter(p=>p.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).sort((a,b)=>a.date.localeCompare(b.date)).map(p=><div key={p.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderBottom:`1px solid ${LGRAY}`}}>
        <div style={{width:6,height:6,borderRadius:50,background:PLATFORM_COLORS[p.platform]||MID,marginTop:6,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:DARK}}>{p.date.split("-")[2]} {SHORT[month]} · <span style={{color:PLATFORM_COLORS[p.platform]||MID}}>{p.platform}</span> · {p.type}</div>
          <div style={{fontSize:12,color:MID,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.caption}</div>
        </div>
        <button onClick={()=>delPost(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e74c3c",fontSize:16,flexShrink:0}}>×</button>
      </div>)}
    </div>}
  </div>;
}

// ── Reach Tool ────────────────────────────────────────────────────────────
function ReachTool({code,onSignOut}:{code:string,onSignOut:()=>void}){
  const [tab,setTab]=useState("guide");
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [posts,setPosts]=useState<CalPost[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [saved,setSaved]=useState(false);
  const [saveTimer,setSaveTimer]=useState<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    async function load(){
      try{const res=await fetch(`/api/tools-data?code=${encodeURIComponent(code)}&tool=reach`);if(res.ok){const j=await res.json();if(j.data){setCampaigns(j.data.campaigns||[]);setPosts(j.data.posts||[]);setLoaded(true);return;}}}catch{}
      try{const s=localStorage.getItem("pds-reach-data");if(s){const p=JSON.parse(s);setCampaigns(p.campaigns||[]);setPosts(p.posts||[]);}}catch{}
      setLoaded(true);
    }
    load();
  },[code]);

  const save=useCallback((c:Campaign[],p:CalPost[])=>{
    const data={campaigns:c,posts:p};
    try{localStorage.setItem("pds-reach-data",JSON.stringify(data));}catch{}
    if(saveTimer)clearTimeout(saveTimer);
    const t=setTimeout(async()=>{try{await fetch("/api/tools-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,tool:"reach",data})});}catch{}},1500);
    setSaveTimer(t);setSaved(true);setTimeout(()=>setSaved(false),1800);
  },[code,saveTimer]);

  const saveCampaigns=(c:Campaign[])=>{setCampaigns(c);save(c,posts);};
  const savePosts=(p:CalPost[])=>{setPosts(p);save(campaigns,p);};

  if(!loaded)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:MID,fontSize:14}}>Loading your data...</div>;

  return <div style={{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
    <div style={{background:DARK,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:1.2,textTransform:"uppercase"}}>Prowess Digital Solutions · 2026</div>
        <div style={{fontSize:18,fontWeight:800,color:W,marginTop:2}}>Reach & Growth Planner</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Prowess Digital Solutions</div>
        <div style={{fontSize:11,fontWeight:600,color:saved?"#81c784":"rgba(255,255,255,.4)",marginTop:2}}>{saved?"✓ Saved":"Auto-saving..."}</div>
      </div>
    </div>
    <div style={{background:B,padding:"9px 22px",display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <a href="/tools" style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,textDecoration:"none"}}>← Tools</a>
        <button onClick={onSignOut} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
      </div>
    </div>
    <div style={{background:W,borderBottom:`2px solid ${MGRAY}`,display:"flex",padding:"0 22px",overflowX:"auto"}}>
      {([["guide","Growth Guide"],["content","Content Ideas"],["ads","Ad Planner"],["calendar","Social Calendar"]] as [string,string][]).map(([v,l])=>
        <button key={v} onClick={()=>setTab(v)} style={{padding:"12px 17px",background:"transparent",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:tab===v?B:"#999",borderBottom:tab===v?`3px solid ${B}`:"3px solid transparent",marginBottom:-2}}>{l}</button>)}
    </div>
    <div style={{padding:"20px 22px",maxWidth:1000,margin:"0 auto"}}>
      {tab==="guide"&&<GuideTab/>}
      {tab==="content"&&<ContentTab/>}
      {tab==="ads"&&<AdPlannerTab campaigns={campaigns} setCampaigns={saveCampaigns}/>}
      {tab==="calendar"&&<CalendarTab posts={posts} setPosts={savePosts}/>}
    </div>
    <div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#aaa"}}>© 2026 Prowess Digital Solutions · prowessdigitalsolutions.com</div>
  </div>;
}

// ── Access Gate ────────────────────────────────────────────────────────────
const REASON_MSG:Record<string,string>={
  invalid:"That code is not recognised. Please check and try again.",
  revoked:"This access code has been revoked. Please contact Prowess Digital Solutions.",
  expired:"This access code has expired. Please contact Prowess Digital Solutions to renew.",
};

export default function ReachPage(){
  const [code,setCode]=useState("");
  const [grantedCode,setGrantedCode]=useState<string|null>(null);
  const [status,setStatus]=useState<"idle"|"checking"|"denied"|"granted">("idle");
  const [reason,setReason]=useState("");

  useEffect(()=>{
    const raw=localStorage.getItem("pds-access-reach");
    if(!raw)return;
    try{const saved=JSON.parse(raw) as {code:string};silentVerify(saved.code);}
    catch{localStorage.removeItem("pds-access-reach");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function silentVerify(savedCode:string){
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:savedCode})});
      const data=await res.json();
      if(data.valid){setGrantedCode(savedCode);setStatus("granted");localStorage.setItem("pds-access-reach",JSON.stringify({code:savedCode}));}
      else{localStorage.removeItem("pds-access-reach");}
    }catch{localStorage.removeItem("pds-access-reach");}
  }

  async function verify(){
    setStatus("checking");
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim()})});
      const data=await res.json();
      if(data.valid){const c=code.trim().toUpperCase();setGrantedCode(c);setStatus("granted");localStorage.setItem("pds-access-reach",JSON.stringify({code:c}));}
      else{setReason(data.reason??"invalid");setStatus("denied");localStorage.removeItem("pds-access-reach");}
    }catch{setReason("invalid");setStatus("denied");}
  }

  function signOut(){localStorage.removeItem("pds-access-reach");setGrantedCode(null);setCode("");setStatus("idle");}

  if(grantedCode)return <ReachTool code={grantedCode} onSignOut={signOut}/>;

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
      .g-root{min-height:100vh;background:#08141a;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;color:#fff}
      .g-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(80,124,128,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.07) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 40%,transparent 100%);pointer-events:none}
      .g-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px)}
      .g-orb-tl{width:700px;height:700px;background:radial-gradient(circle,rgba(80,124,128,.28) 0%,transparent 65%);top:-300px;left:-200px;animation:gOrbTL 14s ease-in-out infinite}
      .g-orb-br{width:500px;height:500px;background:radial-gradient(circle,rgba(40,80,84,.35) 0%,transparent 65%);bottom:-200px;right:-150px;animation:gOrbBR 18s ease-in-out infinite reverse}
      .g-orb-mid{width:400px;height:400px;background:radial-gradient(circle,rgba(80,124,128,.12) 0%,transparent 65%);top:40%;left:55%;animation:gOrbMid 11s ease-in-out infinite}
      @keyframes gOrbTL{0%,100%{transform:translate(0,0)}40%{transform:translate(60px,40px)}70%{transform:translate(-30px,70px)}}
      @keyframes gOrbBR{0%,100%{transform:translate(0,0)}35%{transform:translate(-50px,-40px)}65%{transform:translate(30px,-70px)}}
      @keyframes gOrbMid{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}
      .g-dot{position:absolute;border-radius:50%;background:rgba(80,124,128,.4);pointer-events:none}
      .g-dot-1{width:4px;height:4px;top:18%;left:12%;animation:gDot1 6s ease-in-out infinite}
      .g-dot-2{width:3px;height:3px;top:65%;left:8%;animation:gDot2 8s ease-in-out infinite 1s}
      .g-dot-3{width:5px;height:5px;top:30%;right:14%;animation:gDot1 7s ease-in-out infinite 2s}
      .g-dot-4{width:3px;height:3px;top:75%;right:18%;animation:gDot2 9s ease-in-out infinite .5s}
      .g-dot-5{width:4px;height:4px;top:50%;left:22%;animation:gDot1 5s ease-in-out infinite 3s}
      @keyframes gDot1{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-12px)}}
      @keyframes gDot2{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:.8;transform:translateY(10px)}}
      .g-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:20px 28px}
      .g-nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none}
      .g-nav-dot{width:7px;height:7px;border-radius:50%;background:#507c80;box-shadow:0 0 12px rgba(80,124,128,.8);animation:navBlink 2.5s ease-in-out infinite}
      @keyframes navBlink{0%,100%{opacity:1}50%{opacity:.4}}
      .g-nav-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.3px}
      .g-nav-back{font-size:12px;font-weight:600;color:rgba(255,255,255,.3);text-decoration:none;padding:7px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.08);transition:color .2s,border-color .2s}
      .g-nav-back:hover{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.18)}
      .g-body{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px 40px;position:relative;z-index:10}
      .g-split{width:100%;max-width:960px;display:grid;grid-template-columns:1fr 400px;gap:64px;align-items:center}
      @media(max-width:800px){.g-split{grid-template-columns:1fr;gap:32px;max-width:440px}}
      .g-left{animation:gSlideLeft .7s cubic-bezier(.22,.68,0,1.2) both}
      @keyframes gSlideLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
      .g-tag{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:99px;border:1px solid rgba(80,124,128,.35);background:rgba(80,124,128,.1);font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#6ab8bd;margin-bottom:24px}
      .g-tag-pulse{width:6px;height:6px;border-radius:50%;background:#6ab8bd;box-shadow:0 0 8px rgba(106,184,189,.8);animation:tagPulse 1.8s ease-in-out infinite}
      @keyframes tagPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.5)}}
      .g-headline{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(34px,4.5vw,54px);font-weight:800;line-height:1.06;letter-spacing:-1.2px;margin-bottom:18px}
      .g-headline .hi{background:linear-gradient(135deg,#7ecdd2 0%,#507c80 60%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
      .g-body-txt{font-size:16px;color:rgba(255,255,255,.42);line-height:1.75;margin-bottom:32px;max-width:420px}
      .g-pills{display:flex;flex-direction:column;gap:12px}
      .g-pill{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);animation:gPillIn .5s cubic-bezier(.22,.68,0,1.2) both}
      .g-pill:nth-child(1){animation-delay:.15s}.g-pill:nth-child(2){animation-delay:.25s}.g-pill:nth-child(3){animation-delay:.35s}.g-pill:nth-child(4){animation-delay:.45s}
      @keyframes gPillIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
      .g-pill-icon{width:36px;height:36px;border-radius:10px;background:rgba(80,124,128,.15);border:1px solid rgba(80,124,128,.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
      .g-pill-text{display:flex;flex-direction:column}
      .g-pill-title{font-size:13px;font-weight:700;color:rgba(255,255,255,.8)}
      .g-pill-sub{font-size:11px;color:rgba(255,255,255,.3);margin-top:1px}
      .g-card{animation:gCardIn .7s cubic-bezier(.22,.68,0,1.2) .1s both}
      @keyframes gCardIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      .g-card-inner{position:relative;border-radius:24px;padding:32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px)}
      .g-card-inner::before{content:'';position:absolute;inset:0;border-radius:24px;background:linear-gradient(145deg,rgba(80,124,128,.12) 0%,transparent 50%);pointer-events:none}
      .g-card-glow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(80,124,128,.9),transparent)}
      .g-card-eyebrow{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(80,124,128,.8);margin-bottom:6px}
      .g-card-title{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-.3px}
      .g-card-sub{font-size:13px;color:rgba(255,255,255,.35);line-height:1.55;margin-bottom:24px}
      .g-code-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:10px}
      .g-code-input{width:100%;padding:15px 18px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:14px;color:#fff;font-size:18px;font-weight:800;font-family:'DM Sans',sans-serif;outline:none;text-align:center;letter-spacing:4px;box-sizing:border-box;transition:border-color .25s,background .25s,box-shadow .25s;-webkit-text-fill-color:#fff}
      .g-code-input::placeholder{color:rgba(255,255,255,.2);letter-spacing:2px;font-weight:500;font-size:14px}
      .g-code-input:focus{border-color:rgba(80,124,128,.8);background:rgba(80,124,128,.07);box-shadow:0 0 0 4px rgba(80,124,128,.12)}
      .g-code-input.err{border-color:rgba(255,120,100,.6);box-shadow:0 0 0 4px rgba(255,120,100,.08)}
      .g-err-txt{font-size:12px;font-weight:700;color:#ff8a80;text-align:center;min-height:20px;margin:8px 0 0}
      .g-submit{margin-top:14px;width:100%;padding:16px;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:800;cursor:pointer;transition:opacity .2s,transform .2s}
      .g-submit:not(:disabled){background:linear-gradient(135deg,#507c80 0%,#3a5c60 100%);color:#fff;box-shadow:0 4px 20px rgba(80,124,128,.4)}
      .g-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(80,124,128,.5)}
      .g-submit:disabled{background:rgba(255,255,255,.07);color:rgba(255,255,255,.3);cursor:default}
      .g-hint{font-size:11px;color:rgba(255,255,255,.18);text-align:center;margin-top:14px;line-height:1.7}
      .g-sep{height:1px;background:rgba(255,255,255,.07);margin:20px 0}
      .g-no-code{text-align:center;font-size:12px;color:rgba(255,255,255,.28);line-height:1.6}
      .g-no-code a{color:rgba(80,124,128,.8);text-decoration:none;font-weight:700}
      @media(max-width:800px){.g-left{display:none}.g-body{padding:16px 16px 36px}}
    `}</style>
    <div className="g-root">
      <div className="g-grid"/>
      <div className="g-orb g-orb-tl"/><div className="g-orb g-orb-br"/><div className="g-orb g-orb-mid"/>
      <div className="g-dot g-dot-1"/><div className="g-dot g-dot-2"/><div className="g-dot g-dot-3"/><div className="g-dot g-dot-4"/><div className="g-dot g-dot-5"/>
      <nav className="g-nav">
        <a href="/" className="g-nav-brand"><div className="g-nav-dot"/><span className="g-nav-label">Prowess Digital Solutions</span></a>
        <a href="/tools" className="g-nav-back">← All Tools</a>
      </nav>
      <div className="g-body">
        <div className="g-split">
          <div className="g-left">
            <div className="g-tag"><span className="g-tag-pulse"/><span>Premium Tool</span></div>
            <h1 className="g-headline">Grow with purpose.<br/><span className="hi">Not just noise.</span></h1>
            <p className="g-body-txt">Random posting does not build a business. This planner gives you a real growth strategy, ready-to-use content, and a system to track what is working.</p>
            <div className="g-pills">
              {[{icon:"📖",title:"Growth Guide",sub:"Six things that actually grow African businesses"},{icon:"✍",title:"Content Ideas",sub:"Platform-specific captions you can copy and use today"},{icon:"📣",title:"Ad Planner",sub:"Budget guide and campaign tracker"},{icon:"📅",title:"Social Calendar",sub:"Plan your posts month by month"}].map((f,i)=>(
                <div key={i} className="g-pill"><div className="g-pill-icon">{f.icon}</div><div className="g-pill-text"><span className="g-pill-title">{f.title}</span><span className="g-pill-sub">{f.sub}</span></div></div>
              ))}
            </div>
          </div>
          <div className="g-card">
            <div className="g-card-inner">
              <div className="g-card-glow"/>
              <div className="g-card-eyebrow">Client Access</div>
              <div className="g-card-title">Reach & Growth Planner</div>
              <div className="g-card-sub">Enter your Prowess Digital Solutions access code to unlock.</div>
              <span className="g-code-label">Your access code</span>
              <input value={code} placeholder="PDS-XXXX-XXXX" onChange={e=>{setCode(e.target.value.toUpperCase());setStatus("idle");}} onKeyDown={e=>e.key==="Enter"&&verify()} disabled={status==="checking"} autoComplete="off" className={`g-code-input${status==="denied"?" err":""}`}/>
              <div className="g-err-txt">{status==="denied"?(REASON_MSG[reason]??REASON_MSG.invalid):""}</div>
              <button onClick={verify} disabled={status==="checking"||!code.trim()} className="g-submit">{status==="checking"?"Verifying your code...":"Unlock Growth Planner →"}</button>
              <p className="g-hint">Your access code was provided when you engaged with Prowess Digital Solutions.</p>
              <div className="g-sep"/>
              <div className="g-no-code">No code yet? <a href="/contact">Get in touch</a> to become a client.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>;
}