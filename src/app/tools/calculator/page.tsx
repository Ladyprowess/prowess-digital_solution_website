"use client";
import { useState, useEffect, useCallback } from "react";

// ── Constants ──────────────────────────────────────────────────────────────
const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";
const CATS=["Equipment","Premises / Rent","Stock / Inventory","Licences & Permits","Technology & Software","Marketing & Branding","Professional Fees","Transport","Staff & Training","Miscellaneous"];
const COUNTRIES=[["Algeria","DA"],["Angola","Kz"],["Benin","CFA"],["Botswana","P"],["Burkina Faso","CFA"],["Burundi","Fr"],["Cabo Verde","Esc"],["Cameroon","CFA"],["Central African Republic","CFA"],["Chad","CFA"],["Comoros","Fr"],["Congo DR","FC"],["Congo Republic","CFA"],["Côte d'Ivoire","CFA"],["Djibouti","Fr"],["Egypt","E£"],["Equatorial Guinea","CFA"],["Eritrea","Nfk"],["Eswatini","L"],["Ethiopia","Br"],["Gabon","CFA"],["Gambia","D"],["Ghana","GH₵"],["Guinea","Fr"],["Guinea-Bissau","CFA"],["Kenya","KSh"],["Lesotho","L"],["Liberia","L$"],["Libya","LD"],["Madagascar","Ar"],["Malawi","MK"],["Mali","CFA"],["Mauritania","UM"],["Mauritius","₨"],["Morocco","MAD"],["Mozambique","MT"],["Namibia","N$"],["Niger","CFA"],["Nigeria","₦"],["Rwanda","Fr"],["São Tomé and Príncipe","Db"],["Senegal","CFA"],["Seychelles","₨"],["Sierra Leone","Le"],["Somalia","Sh"],["South Africa","R"],["South Sudan","£"],["Sudan","£"],["Tanzania","TSh"],["Togo","CFA"],["Tunisia","DT"],["Uganda","USh"],["Zambia","ZK"],["Zimbabwe","Z$"]];
const getSym = (c:string) => (COUNTRIES.find(x=>x[0]===c)||["","₦"])[1];
const mkid = () => Math.random().toString(36).slice(2,9);
const num = (v:unknown) => { const x=parseFloat(String(v||"").replace(/,/g,"")); return isNaN(x)?0:x; };
const fmt = (v:unknown) => Math.round(num(v)).toLocaleString("en")||"0";
const pct = (v:unknown) => v ? (num(v)*100).toFixed(1)+"%" : " ";

// ── Styles ─────────────────────────────────────────────────────────────────
const card:React.CSSProperties={background:W,borderRadius:12,padding:"20px 24px",boxShadow:"0 1px 6px rgba(58,92,96,.10)",border:`1px solid ${MGRAY}`,marginBottom:16};
const TH:React.CSSProperties={background:B,color:W,padding:"10px 12px",fontWeight:700,fontSize:12,textAlign:"left",whiteSpace:"nowrap"};
const TD=(a:boolean):React.CSSProperties=>({padding:"8px 10px",fontSize:13,color:DARK,background:a?LGRAY:W,borderBottom:`1px solid ${LGRAY}`});

// ── Shared UI ──────────────────────────────────────────────────────────────
function Inp({val,set,ph="",type="text",right=false}:{val:unknown,set:(v:string)=>void,ph?:string,type?:string,right?:boolean}){
  const [f,sf]=useState(false);
  return <input type={type} value={String(val||"")} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)}
    style={{padding:"8px 11px",border:`1.5px solid ${f?B:MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",textAlign:right?"right":"left"}}/>;
}
function Sel({val,set,opts}:{val:unknown,set:(v:string)=>void,opts:string[]}){
  return <select value={String(val||"")} onChange={e=>set(e.target.value)} style={{padding:"8px 11px",border:`1.5px solid ${MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",background:W}}>
    {opts.map(o=><option key={o} value={o}>{o}</option>)}
  </select>;
}
function Del({fn}:{fn:()=>void}){return <button onClick={fn} style={{background:"none",border:"none",cursor:"pointer",color:"#e74c3c",fontSize:18,padding:"0 4px"}}>×</button>}
function AddRow({fn,lbl="+ Add Row"}:{fn:()=>void,lbl?:string}){return <button onClick={fn} style={{marginTop:10,padding:"8px 16px",background:"transparent",border:`1.5px dashed ${MID}`,borderRadius:8,color:MID,fontSize:13,fontWeight:600,cursor:"pointer"}}>{lbl}</button>}
function KPI({label,val,sub,accent,warn}:{label:string,val:string,sub?:string,accent?:boolean,warn?:boolean}){
  const bg=warn?"#fdecea":accent?B:LITE,tc=warn?"#c0392b":accent?W:DARK,sc=warn?"#c0392b":accent?"rgba(255,255,255,.7)":MID;
  return <div style={{background:bg,borderRadius:10,padding:"16px 18px",border:`1px solid ${warn?"#f5c6cb":accent?DARK:MGRAY}`}}>
    <div style={{fontSize:10,fontWeight:700,color:sc,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:800,color:tc}}>{val}</div>
    {sub&&<div style={{fontSize:12,color:sc,marginTop:3}}>{sub}</div>}
  </div>;
}
function Toggle({val,set,opts}:{val:string,set:(v:string)=>void,opts:{v:string,l:string}[]}){
  return <div style={{display:"inline-flex",background:LGRAY,borderRadius:10,padding:3,gap:2}}>
    {opts.map(o=><button key={o.v} onClick={()=>set(o.v)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:val===o.v?B:"transparent",color:val===o.v?W:MID}}>{o.l}</button>)}
  </div>;
}

// ── Default data ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDefault = ():any => ({
  info:{biz:"",trade:"",city:"",country:"Nigeria"},
  costs:[
    {id:mkid(),desc:"Business registration (CAC)",cat:"Licences & Permits",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Tools or equipment",cat:"Equipment",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Opening stock or raw materials",cat:"Stock / Inventory",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Business phone or laptop",cat:"Technology & Software",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Workspace setup or signage",cat:"Premises / Rent",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Security deposit (if renting)",cat:"Premises / Rent",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Packaging materials",cat:"Stock / Inventory",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"First month transport",cat:"Transport",est:"",act:"",ess:"Essential",note:""},
    {id:mkid(),desc:"Logo and branding",cat:"Marketing & Branding",est:"",act:"",ess:"Optional",note:""},
    {id:mkid(),desc:"Emergency buffer (10%)",cat:"Miscellaneous",est:"",act:"",ess:"Essential",note:""},
  ],
  fixed:[
    {id:mkid(),item:"Rent / workspace",amt:""},
    {id:mkid(),item:"Phone and data",amt:""},
    {id:mkid(),item:"Electricity and utilities",amt:""},
    {id:mkid(),item:"Power supply fuel",amt:""},
    {id:mkid(),item:"Staff wages",amt:""},
    {id:mkid(),item:"Loan repayments",amt:""},
    {id:mkid(),item:"Other fixed costs",amt:""},
  ],
  variable:[
    {id:mkid(),item:"Raw materials / ingredients",cpj:""},
    {id:mkid(),item:"Packaging per unit",cpj:""},
    {id:mkid(),item:"Transport per job",cpj:""},
    {id:mkid(),item:"Other per-job cost",cpj:""},
  ],
  price:"",targetMargin:"25",
  items:[{id:mkid(),type:"service",name:"",mats:"",hrs:"",rate:"",svcOther:"",margin:"25",costPrice:"",packaging:"",transport:"",powerSupply:"",other:"",qty:"1",sellPrice:""}],
  funding:[
    {id:mkid(),src:"Personal savings",avail:"",conf:"",note:""},
    {id:mkid(),src:"Family or friends",avail:"",conf:"",note:""},
    {id:mkid(),src:"Bank or microfinance loan",avail:"",conf:"",note:""},
  ],
});

// ── Tab: Startup Costs ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabCosts({d,sd,sym}:{d:any,sd:any,sym:string}){
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd=(id:string,f:string,v:string)=>sd((x:any)=>({...x,costs:x.costs.map((r:any)=>r.id===id?{...r,[f]:v}:r)}));
  const totEst=d.costs.reduce((a:number,r:any)=>a+num(r.est),0);
  const essEst=d.costs.filter((r:any)=>r.ess==="Essential").reduce((a:number,r:any)=>a+num(r.est),0);
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
      <KPI label="Total Estimated" val={`${sym}${fmt(totEst)}`}/>
      <KPI label="Total Actual Spent" val={`${sym}${fmt(d.costs.reduce((a:number,r:any)=>a+num(r.act),0))}`}/>
      <KPI accent label="Minimum to Launch" val={`${sym}${fmt(essEst)}`} sub="Essential costs only"/>
    </div>
    <div style={card}>
      <p style={{fontSize:13,color:MID,margin:"0 0 14px",lineHeight:1.6}}>List every cost to launch. Mark as <b>Essential</b> (must have before opening) or <b>Optional</b>. Fill <b>Estimated</b> now, update <b>Actual</b> as you spend.</p>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
        <thead><tr>
          <th style={{...TH,width:"26%"}}>Cost Item</th><th style={{...TH,width:"16%"}}>Category</th>
          <th style={{...TH,textAlign:"right" as const,width:"13%"}}>{`Estimated (${sym})`}</th>
          <th style={{...TH,textAlign:"right" as const,width:"13%"}}>{`Actual (${sym})`}</th>
          <th style={{...TH,width:"11%"}}>Essential?</th><th style={{...TH,width:"18%"}}>Notes</th><th style={{...TH,width:"3%"}}></th>
        </tr></thead>
        <tbody>{d.costs.map((r:any,i:number)=><tr key={r.id}>
          <td style={TD(i%2===1)}><Inp val={r.desc} set={v=>upd(r.id,"desc",v)} ph="What is this cost?"/></td>
          <td style={TD(i%2===1)}><Sel val={r.cat} set={v=>upd(r.id,"cat",v)} opts={CATS}/></td>
          <td style={TD(i%2===1)}><Inp val={r.est} set={v=>upd(r.id,"est",v)} type="number" right ph="0"/></td>
          <td style={TD(i%2===1)}><Inp val={r.act} set={v=>upd(r.id,"act",v)} type="number" right ph="0"/></td>
          <td style={TD(i%2===1)}><Sel val={r.ess} set={v=>upd(r.id,"ess",v)} opts={["Essential","Optional","Unknown"]}/></td>
          <td style={TD(i%2===1)}><Inp val={r.note} set={v=>upd(r.id,"note",v)} ph="Any note"/></td>
          <td style={TD(i%2===1)}><Del fn={()=>sd((x:any)=>({...x,costs:x.costs.filter((c:any)=>c.id!==r.id)}))}/></td>
        </tr>)}</tbody>
      </table></div>
      <AddRow fn={()=>sd((x:any)=>({...x,costs:[...x.costs,{id:mkid(),desc:"",cat:"Miscellaneous",est:"",act:"",ess:"Essential",note:""}]}))}/>
    </div>
  </div>;
}

// ── Tab: Break-Even ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabBreakEven({d,sd,sym}:{d:any,sd:any,sym:string}){
  const updF=(id:string,f:string,v:string)=>sd((x:any)=>({...x,fixed:x.fixed.map((r:any)=>r.id===id?{...r,[f]:v}:r)}));
  const updV=(id:string,f:string,v:string)=>sd((x:any)=>({...x,variable:x.variable.map((r:any)=>r.id===id?{...r,[f]:v}:r)}));
  const TF=d.fixed.reduce((a:number,r:any)=>a+num(r.amt),0);
  const TV=d.variable.reduce((a:number,r:any)=>a+num(r.cpj),0);
  const P=num(d.price),M=num(d.targetMargin)/100,CM=P-TV;
  const beJobs=CM>0?Math.ceil(TF/CM):null,beRev=beJobs?beJobs*P:null;
  const tgtRev=beRev&&M<1?beRev/(1-M):null,tgtJobs=tgtRev&&P>0?Math.ceil(tgtRev/P):null;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={card}>
        <h3 style={{margin:"0 0 12px",color:DARK,fontSize:15}}>Monthly Fixed Costs</h3>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={TH}>Cost Item</th><th style={{...TH,textAlign:"right" as const,width:"38%"}}>{`Per Month (${sym})`}</th><th style={{...TH,width:36}}></th></tr></thead>
          <tbody>{d.fixed.map((r:any,i:number)=><tr key={r.id}><td style={TD(i%2===1)}><Inp val={r.item} set={v=>updF(r.id,"item",v)} ph="e.g. Rent"/></td><td style={TD(i%2===1)}><Inp val={r.amt} set={v=>updF(r.id,"amt",v)} type="number" right ph="0"/></td><td style={TD(i%2===1)}><Del fn={()=>sd((x:any)=>({...x,fixed:x.fixed.filter((c:any)=>c.id!==r.id)}))}/></td></tr>)}</tbody>
        </table>
        <AddRow fn={()=>sd((x:any)=>({...x,fixed:[...x.fixed,{id:mkid(),item:"",amt:""}]}))}/>
        <div style={{marginTop:12,background:B,color:W,borderRadius:8,padding:"11px 14px",fontWeight:700,fontSize:13,display:"flex",justifyContent:"space-between"}}><span>TOTAL FIXED</span><span>{sym}{fmt(TF)}/month</span></div>
      </div>
      <div style={card}>
        <h3 style={{margin:"0 0 12px",color:DARK,fontSize:15}}>Variable Costs per Job/Sale</h3>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={TH}>Cost Item</th><th style={{...TH,textAlign:"right" as const,width:"38%"}}>{`Per Job (${sym})`}</th><th style={{...TH,width:36}}></th></tr></thead>
          <tbody>{d.variable.map((r:any,i:number)=><tr key={r.id}><td style={TD(i%2===1)}><Inp val={r.item} set={v=>updV(r.id,"item",v)} ph="e.g. Materials per job"/></td><td style={TD(i%2===1)}><Inp val={r.cpj} set={v=>updV(r.id,"cpj",v)} type="number" right ph="0"/></td><td style={TD(i%2===1)}><Del fn={()=>sd((x:any)=>({...x,variable:x.variable.filter((c:any)=>c.id!==r.id)}))}/></td></tr>)}</tbody>
        </table>
        <AddRow fn={()=>sd((x:any)=>({...x,variable:[...x.variable,{id:mkid(),item:"",cpj:""}]}))}/>
        <div style={{marginTop:12,background:B,color:W,borderRadius:8,padding:"11px 14px",fontWeight:700,fontSize:13,display:"flex",justifyContent:"space-between"}}><span>TOTAL VARIABLE/JOB</span><span>{sym}{fmt(TV)}</span></div>
      </div>
    </div>
    <div style={card}>
      <h3 style={{margin:"0 0 14px",color:DARK,fontSize:15}}>Break-Even Calculation</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
        <div><label style={{fontSize:13,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>{`Average price per job or sale (${sym})`}</label><Inp val={d.price} set={v=>sd((x:any)=>({...x,price:v}))} type="number" ph="How much do you charge?"/></div>
        <div><label style={{fontSize:13,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>Target profit margin (%)</label><Inp val={d.targetMargin} set={v=>sd((x:any)=>({...x,targetMargin:v}))} type="number" ph="e.g. 25"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <KPI label="Contribution Margin" val={num(d.price)?`${sym}${fmt(CM)}`:" "} warn={CM<=0&&num(d.price)>0} sub={num(d.price)?`${pct(CM/num(d.price))} of price`:"Enter price above"}/>
        <KPI accent label="Break-Even Jobs/Month" val={beJobs?`${beJobs} jobs`:" "} sub="minimum to cover all costs"/>
        <KPI label="Break-Even Revenue" val={beRev?`${sym}${fmt(beRev)}`:" "} sub="minimum monthly income"/>
        <KPI label={`Jobs for ${d.targetMargin}% Profit`} val={tgtJobs?`${tgtJobs} jobs`:" "} sub="your monthly target"/>
      </div>
    </div>
  </div>;
}

// ── Tab: Pricing ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PricingItem({sv,idx,TF,upd,del,sym}:{sv:any,idx:number,TF:number,upd:(f:string,v:string)=>void,del:()=>void,sym:string}){
  const type=sv.type||"service";
  const overhead=TF>0?TF/20:0;
  const timeCost=num(sv.hrs)*num(sv.rate);
  const svcCost=num(sv.mats)+timeCost+num(sv.svcOther)+overhead;
  const svcMin=num(sv.margin)<100&&svcCost>0?svcCost/(1-num(sv.margin)/100):svcCost;
  const unitCost=num(sv.costPrice)+num(sv.packaging)+num(sv.transport)+num(sv.powerSupply)+num(sv.other);
  const prodTotal=unitCost+(overhead/Math.max(num(sv.qty)||1,1));
  const prodMin=num(sv.margin)<100&&prodTotal>0?prodTotal/(1-num(sv.margin)/100):prodTotal;
  const markupPct=unitCost>0?((num(sv.sellPrice)-unitCost)/unitCost)*100:0;
  const underpriced=num(sv.sellPrice)>0&&num(sv.sellPrice)<prodTotal;
  return <div style={{...card,marginBottom:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:700,color:MID,textTransform:"uppercase",letterSpacing:.8,marginBottom:5}}>Item {idx+1}</div>
        <input value={sv.name||""} onChange={e=>upd("name",e.target.value)} placeholder="Name this service or product"
          style={{padding:"8px 12px",border:`1.5px solid ${MGRAY}`,borderRadius:8,fontSize:14,fontWeight:700,outline:"none",width:280,color:DARK}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Toggle val={type} set={v=>upd("type",v)} opts={[{v:"service",l:"Service"},{v:"product",l:"Product"},{v:"both",l:"Both"}]}/>
        <Del fn={del}/>
      </div>
    </div>
    {(type==="service"||type==="both")&&<div style={{marginBottom:type==="both"?20:0}}>
      {type==="both"&&<div style={{fontSize:12,fontWeight:700,color:DARK,textTransform:"uppercase",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${MGRAY}`}}>Service Pricing</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:14}}>
        {([[`Materials / Ingredients (${sym})`,"mats"],[`Time Required (hours)`,"hrs"],[`Your Hourly Rate (${sym})`,"rate"],[`Other Service Costs (${sym})`,"svcOther"],["Target Margin (%)","margin"]] as [string,string][]).map(([l,f])=>
          <div key={f}><label style={{fontSize:11,fontWeight:700,color:MID,display:"block",marginBottom:4,textTransform:"uppercase"}}>{l}</label><Inp val={sv[f]} set={v=>upd(f,v)} type="number"/></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
        {([["Time Cost",`${sym}${fmt(timeCost)}`,LGRAY,DARK],["Overhead",`${sym}${fmt(overhead)}`,LGRAY,DARK],["Total Cost",`${sym}${fmt(svcCost)}`,LGRAY,DARK],["Min Price",`${sym}${fmt(svcMin)}`,B,W],["Recommended",`${sym}${fmt(svcMin*1.1)}`,DARK,W]] as [string,string,string,string][]).map(([l,v,bg,tc])=>
          <div key={l} style={{background:bg,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:tc===W?"rgba(255,255,255,.7)":MID,marginBottom:3}}>{l}</div><div style={{fontSize:17,fontWeight:800,color:tc}}>{v}</div></div>)}
      </div>
    </div>}
    {(type==="product"||type==="both")&&<div>
      {type==="both"&&<div style={{fontSize:12,fontWeight:700,color:DARK,textTransform:"uppercase",marginBottom:10,marginTop:4,paddingBottom:6,borderBottom:`1px solid ${MGRAY}`}}>Product Pricing</div>}
      <div style={{...card,background:LITE,border:`1px solid ${MID}`,padding:"12px 16px",marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:DARK,marginBottom:10}}>Cost per Unit</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
          {([[`Cost Price/Unit (${sym})`,"costPrice","What you pay to make or buy it"],["Packaging/Unit (₦)","packaging","Bag, box, label etc."],["Transport/Unit (₦)","transport","Delivery or getting stock"],["Power Supply/Unit (₦)","powerSupply","Fuel cost spread per unit"],["Other Variable Cost (₦)","other","Any other cost per unit"],["Units per Month","qty","How many do you expect to sell?"]] as [string,string,string][]).map(([l,f,h])=>
            <div key={f}><label style={{fontSize:11,fontWeight:700,color:DARK,display:"block",marginBottom:4}}>{l}</label><Inp val={sv[f]} set={v=>upd(f,v)} type="number" ph={h}/></div>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div><label style={{fontSize:13,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>{`Your Selling Price (${sym})`}</label><Inp val={sv.sellPrice} set={v=>upd("sellPrice",v)} type="number" ph="What you charge the customer"/></div>
        <div><label style={{fontSize:13,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>Target Profit Margin (%)</label><Inp val={sv.margin} set={v=>upd("margin",v)} type="number" ph="e.g. 35"/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
        {([["Unit Variable Cost",`${sym}${fmt(unitCost)}`,LGRAY,DARK],["Overhead/Unit",`${sym}${fmt(overhead/Math.max(num(sv.qty)||1,1))}`,LGRAY,DARK],["Total Cost/Unit",`${sym}${fmt(prodTotal)}`,LGRAY,DARK],["Min Selling Price",`${sym}${fmt(prodMin)}`,B,W]] as [string,string,string,string][]).map(([l,v,bg,tc])=>
          <div key={l} style={{background:bg,borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:tc===W?"rgba(255,255,255,.7)":MID,marginBottom:3}}>{l}</div><div style={{fontSize:17,fontWeight:800,color:tc}}>{v}</div></div>)}
        {num(sv.sellPrice)>0&&<div style={{background:markupPct>=30?"#e8f5e9":"#fdecea",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:markupPct>=30?"#388e3c":"#c0392b",marginBottom:3}}>Markup on Cost</div>
          <div style={{fontSize:17,fontWeight:800,color:markupPct>=30?"#2e7d32":"#c0392b"}}>{Math.round(markupPct)}%</div>
        </div>}
      </div>
      {underpriced&&<div style={{marginTop:12,background:"#fdecea",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:700,color:"#c0392b"}}>
        ⚠ Your selling price of {sym}{fmt(sv.sellPrice)} is below your total cost of {sym}{fmt(prodTotal)}. You are selling at a loss. Raise your price to at least {sym}{fmt(prodMin)}.
      </div>}
    </div>}
  </div>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabPricing({d,sd,sym}:{d:any,sd:any,sym:string}){
  const TF=d.fixed.reduce((a:number,r:any)=>a+num(r.amt),0);
  const upd=(id:string,f:string,v:string)=>sd((x:any)=>({...x,items:x.items.map((s:any)=>s.id===id?{...s,[f]:v}:s)}));
  const add=()=>sd((x:any)=>({...x,items:[...(x.items||[]),{id:mkid(),type:"service",name:"",mats:"",hrs:"",rate:"",svcOther:"",margin:"25",costPrice:"",packaging:"",transport:"",powerSupply:"",other:"",qty:"1",sellPrice:""}]}));
  return <div>
    <div style={{...card,background:LITE,border:`1.5px solid ${B}`,padding:"16px 20px"}}>
      <p style={{margin:0,fontSize:13,color:DARK,lineHeight:1.7}}>Select <b>Service</b>, <b>Product</b>, or <b>Both</b>. For products, enter every cost per unit including transport and power supply. Never price below the minimum.</p>
    </div>
    {(d.items||[]).map((sv:any,idx:number)=><PricingItem key={sv.id} sv={sv} idx={idx} TF={TF} upd={(f,v)=>upd(sv.id,f,v)} sym={sym} del={()=>sd((x:any)=>({...x,items:x.items.filter((s:any)=>s.id!==sv.id)}))}/>)}
    {(d.items||[]).length<8&&<AddRow fn={add} lbl="+ Add Another Item"/>}
  </div>;
}

// ── Tab: Funding ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabFunding({d,sd,sym}:{d:any,sd:any,sym:string}){
  const totEst=d.costs.reduce((a:number,r:any)=>a+num(r.est),0);
  const totConf=d.funding.reduce((a:number,r:any)=>a+num(r.conf),0);
  const gap=totEst-totConf;
  const upd=(id:string,f:string,v:string)=>sd((x:any)=>({...x,funding:x.funding.map((r:any)=>r.id===id?{...r,[f]:v}:r)}));
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
      <KPI label="Startup Costs" val={`${sym}${fmt(totEst)}`}/>
      <KPI accent label="Funding Confirmed" val={`${sym}${fmt(totConf)}`}/>
      <KPI warn={gap>0} label={gap>0?"Funding Gap":"Surplus"} val={`${sym}${fmt(Math.abs(gap))}`} sub={gap>0?"still needed":"you are covered"}/>
    </div>
    <div style={card}>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
        <thead><tr>
          <th style={{...TH,width:"28%"}}>Funding Source</th>
          <th style={{...TH,textAlign:"right" as const,width:"18%"}}>{`Available (${sym})`}</th>
          <th style={{...TH,textAlign:"right" as const,width:"18%"}}>{`Confirmed (${sym})`}</th>
          <th style={TH}>Notes / Conditions</th><th style={{...TH,width:"4%"}}></th>
        </tr></thead>
        <tbody>{d.funding.map((r:any,i:number)=><tr key={r.id}>
          <td style={TD(i%2===1)}><Inp val={r.src} set={v=>upd(r.id,"src",v)}/></td>
          <td style={TD(i%2===1)}><Inp val={r.avail} set={v=>upd(r.id,"avail",v)} type="number" right ph="0"/></td>
          <td style={TD(i%2===1)}><Inp val={r.conf} set={v=>upd(r.id,"conf",v)} type="number" right ph="0"/></td>
          <td style={TD(i%2===1)}><Inp val={r.note} set={v=>upd(r.id,"note",v)} ph="Any conditions"/></td>
          <td style={TD(i%2===1)}><Del fn={()=>sd((x:any)=>({...x,funding:x.funding.filter((f:any)=>f.id!==r.id)}))}/></td>
        </tr>)}</tbody>
      </table></div>
      <AddRow fn={()=>sd((x:any)=>({...x,funding:[...x.funding,{id:mkid(),src:"",avail:"",conf:"",note:""}]}))}/>
    </div>
    {gap>0&&<div style={{...card,background:"#fdecea",border:"1.5px solid #f5c6cb"}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#c0392b"}}>⚠ Funding gap of {sym}{fmt(gap)}. Do not launch until this is closed.</p></div>}
    {gap<=0&&totConf>0&&<div style={{...card,background:"#e8f5e9",border:"1.5px solid #a5d6a7"}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#2e7d32"}}>✓ Your confirmed funding covers your startup costs. You are ready.</p></div>}
  </div>;
}

// ── Calculator Tool ────────────────────────────────────────────────────────
const TABS=[{id:"costs",l:"Startup Costs"},{id:"breakeven",l:"Break-Even"},{id:"pricing",l:"Pricing"},{id:"funding",l:"Funding"}];

function CalculatorTool({code,onSignOut}:{code:string,onSignOut:()=>void}){
  const [tab,setTab]=useState("costs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [d,sd]=useState<any>(null);
  const sym=d?getSym(d.info.country||"Nigeria"):"₦";
  const [saved,setSaved]=useState(false);
  const [saveTimer,setSaveTimer]=useState<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    async function load(){
      try{
        const res=await fetch(`/api/tools-data?code=${encodeURIComponent(code)}&tool=calculator`);
        if(res.ok){const j=await res.json();if(j.data){sd(j.data);return;}}
      }catch{}
      try{const s=localStorage.getItem("pds-calc-data");if(s){const p=JSON.parse(s);if(!p.items&&p.services)p.items=p.services;if(!p.items)p.items=makeDefault().items;sd(p);return;}}catch{}
      sd(makeDefault());
    }
    load();
  },[code]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save=useCallback((data:any)=>{
    try{localStorage.setItem("pds-calc-data",JSON.stringify(data));}catch{}
    if(saveTimer)clearTimeout(saveTimer);
    const t=setTimeout(async()=>{
      try{await fetch("/api/tools-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,tool:"calculator",data})});}catch{}
    },1500);
    setSaveTimer(t);
    setSaved(true);setTimeout(()=>setSaved(false),1800);
  },[code,saveTimer]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update=(fn:(prev:any)=>any)=>{sd((prev:any)=>{const next=fn(prev);save(next);return next;});};

  if(!d)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:MID,fontSize:14}}>Loading your data...</div>;

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
      <div style={{background:DARK,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:1.2,textTransform:"uppercase"}}>Prowess Digital Solutions · 2026</div>
          <div style={{fontSize:18,fontWeight:800,color:W,marginTop:2}}>Startup Cost & Break-Even Calculator</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Prowess Digital Solutions</div>
          <div style={{fontSize:11,fontWeight:600,color:saved?"#81c784":"rgba(255,255,255,.4)",marginTop:2}}>{saved?"✓ Saved":"Auto-saving..."}</div>
        </div>
      </div>
      <div style={{background:B,padding:"9px 22px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        {([["biz","Business Name",170],["trade","Trade / Service",170],["city","City",130]] as [string,string,number][]).map(([f,p,w])=>
          <input key={f} value={d.info[f]||""} placeholder={p} onChange={e=>update(x=>({...x,info:{...x.info,[f]:e.target.value}}))}
            style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,padding:"6px 12px",color:W,fontSize:13,fontWeight:600,outline:"none",width:w}}/>)}
        <select value={d.info.country||"Nigeria"} onChange={e=>update(x=>({...x,info:{...x.info,country:e.target.value}}))}
          style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,padding:"6px 10px",color:W,fontSize:13,fontWeight:600,outline:"none",width:160,cursor:"pointer"}}>
          {COUNTRIES.map(([n])=><option key={n} value={n} style={{color:"#333"}}>{n}</option>)}
        </select>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <a href="/tools" style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,textDecoration:"none"}}>← Tools</a>
          <button onClick={onSignOut} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>
      <div style={{background:W,borderBottom:`2px solid ${MGRAY}`,display:"flex",padding:"0 22px",overflowX:"auto"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"12px 18px",background:"transparent",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:tab===t.id?B:"#999",borderBottom:tab===t.id?`3px solid ${B}`:"3px solid transparent",marginBottom:-2}}>{t.l}</button>)}
      </div>
      <div style={{padding:"20px 22px",maxWidth:1200,margin:"0 auto"}}>
        {tab==="costs"&&<TabCosts d={d} sd={update} sym={sym}/>}
        {tab==="breakeven"&&<TabBreakEven d={d} sd={update} sym={sym}/>}
        {tab==="pricing"&&<TabPricing d={d} sd={update} sym={sym}/>}
        {tab==="funding"&&<TabFunding d={d} sd={update} sym={sym}/>}
      </div>
      <div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#aaa"}}>© 2026 Prowess Digital Solutions · prowessdigitalsolutions.com</div>
    </div>
  );
}

// ── Access Gate ────────────────────────────────────────────────────────────
const REASON_MSG:Record<string,string>={
  invalid:"That code is not recognised. Please check and try again.",
  revoked:"This access code has been revoked. Please contact Prowess Digital Solutions.",
  expired:"This access code has expired. Please contact Prowess Digital Solutions to renew.",
};

export default function CalculatorPage(){
  const [code,setCode]=useState("");
  const [grantedCode,setGrantedCode]=useState<string|null>(null);
  const [status,setStatus]=useState<"idle"|"checking"|"granted"|"denied">("idle");
  const [reason,setReason]=useState("");

  useEffect(()=>{
    const raw=localStorage.getItem("pds-v2-calculator");
    if(!raw)return;
    try{
      const saved=JSON.parse(raw) as {code:string};
      silentVerify(saved.code);
    }catch{localStorage.removeItem("pds-v2-calculator");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function silentVerify(savedCode:string){
    try{
      const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:savedCode})});
      const data=await res.json();
      if(data.valid){setGrantedCode(savedCode);localStorage.setItem("pds-v2-calculator",JSON.stringify({code:savedCode}));}
      else{localStorage.removeItem("pds-v2-calculator");}
    }catch{localStorage.removeItem("pds-v2-calculator");}
  }

  async function verify(){
    setStatus("checking");
    try{
      const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim()})});
      const data=await res.json();
      if(data.valid){const c=code.trim().toUpperCase();setGrantedCode(c);localStorage.setItem("pds-v2-calculator",JSON.stringify({code:c}));}
      else{setReason(data.reason??"invalid");setStatus("denied");localStorage.removeItem("pds-v2-calculator");}
    }catch{setReason("invalid");setStatus("denied");}
  }

  function signOut(){
    localStorage.removeItem("pds-v2-calculator");
    setGrantedCode(null);
    setCode("");
    setStatus("idle");
  }



  if(grantedCode) return <CalculatorTool code={grantedCode} onSignOut={signOut}/>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .g-root{min-height:100vh;background:#08141a;display:flex;flex-direction:column;align-items:stretch;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;color:#fff}

        /* ── Animated grid ── */
        .g-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(80,124,128,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(80,124,128,.07) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 40%,transparent 100%);pointer-events:none}

        /* ── Orbs ── */
        .g-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px)}
        .g-orb-tl{width:700px;height:700px;background:radial-gradient(circle,rgba(80,124,128,.28) 0%,transparent 65%);top:-300px;left:-200px;animation:gOrbTL 14s ease-in-out infinite}
        .g-orb-br{width:500px;height:500px;background:radial-gradient(circle,rgba(40,80,84,.35) 0%,transparent 65%);bottom:-200px;right:-150px;animation:gOrbBR 18s ease-in-out infinite reverse}
        .g-orb-mid{width:400px;height:400px;background:radial-gradient(circle,rgba(80,124,128,.12) 0%,transparent 65%);top:40%;left:55%;animation:gOrbMid 11s ease-in-out infinite}
        @keyframes gOrbTL{0%,100%{transform:translate(0,0)}40%{transform:translate(60px,40px)}70%{transform:translate(-30px,70px)}}
        @keyframes gOrbBR{0%,100%{transform:translate(0,0)}35%{transform:translate(-50px,-40px)}65%{transform:translate(30px,-70px)}}
        @keyframes gOrbMid{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,30px)}}

        /* ── Floating dots ── */
        .g-dot{position:absolute;border-radius:50%;background:rgba(80,124,128,.4);pointer-events:none}
        .g-dot-1{width:4px;height:4px;top:18%;left:12%;animation:gDot1 6s ease-in-out infinite}
        .g-dot-2{width:3px;height:3px;top:65%;left:8%;animation:gDot2 8s ease-in-out infinite 1s}
        .g-dot-3{width:5px;height:5px;top:30%;right:14%;animation:gDot1 7s ease-in-out infinite 2s}
        .g-dot-4{width:3px;height:3px;top:75%;right:18%;animation:gDot2 9s ease-in-out infinite .5s}
        .g-dot-5{width:4px;height:4px;top:50%;left:22%;animation:gDot1 5s ease-in-out infinite 3s}
        @keyframes gDot1{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-12px)}}
        @keyframes gDot2{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:.8;transform:translateY(10px)}}

        /* ── Layout ── */
        .g-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:20px 28px}
        .g-nav-brand{display:flex;align-items:center;gap:8px;text-decoration:none}
        .g-nav-dot{width:7px;height:7px;border-radius:50%;background:#507c80;box-shadow:0 0 12px rgba(80,124,128,.8);animation:navBlink 2.5s ease-in-out infinite}
        @keyframes navBlink{0%,100%{opacity:1}50%{opacity:.4}}
        .g-nav-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.3px}
        .g-nav-back{font-size:12px;font-weight:600;color:rgba(255,255,255,.3);text-decoration:none;padding:7px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.08);transition:color .2s,border-color .2s}
        .g-nav-back:hover{color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.18)}

        .g-body{flex:1;display:flex;align-items:center;justify-content:center;padding:24px 20px 40px;position:relative;z-index:10}

        /* ── Split layout ── */
        .g-split{width:100%;max-width:960px;display:grid;grid-template-columns:1fr 400px;gap:64px;align-items:center}
        @media(max-width:800px){.g-split{grid-template-columns:1fr;gap:32px;max-width:440px}}

        /* ── Left side ── */
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
        .g-pill:nth-child(1){animation-delay:.15s}
        .g-pill:nth-child(2){animation-delay:.25s}
        .g-pill:nth-child(3){animation-delay:.35s}
        .g-pill:nth-child(4){animation-delay:.45s}
        @keyframes gPillIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        .g-pill-icon{width:36px;height:36px;border-radius:10px;background:rgba(80,124,128,.15);border:1px solid rgba(80,124,128,.2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .g-pill-text{display:flex;flex-direction:column}
        .g-pill-title{font-size:13px;font-weight:700;color:rgba(255,255,255,.8)}
        .g-pill-sub{font-size:11px;color:rgba(255,255,255,.3);margin-top:1px}

        /* ── Right: card ── */
        .g-card{animation:gCardIn .7s cubic-bezier(.22,.68,0,1.2) .1s both}
        @keyframes gCardIn{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

        .g-card-inner{position:relative;border-radius:24px;padding:32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(20px)}
        .g-card-inner::before{content:'';position:absolute;inset:0;border-radius:24px;background:linear-gradient(145deg,rgba(80,124,128,.12) 0%,transparent 50%);pointer-events:none}
        .g-card-glow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(80,124,128,.9),transparent)}

        .g-card-eyebrow{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(80,124,128,.8);margin-bottom:6px}
        .g-card-title{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-.3px}
        .g-card-sub{font-size:13px;color:rgba(255,255,255,.35);line-height:1.55;margin-bottom:24px}

        .g-code-wrap{position:relative;margin-bottom:6px}
        .g-code-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:10px}
        .g-code-input{width:100%;padding:15px 18px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:14px;color:#fff;font-size:18px;font-weight:800;font-family:'DM Sans',sans-serif;outline:none;text-align:center;letter-spacing:4px;box-sizing:border-box;transition:border-color .25s,background .25s,box-shadow .25s;-webkit-text-fill-color:#fff}
        .g-code-input::placeholder{color:rgba(255,255,255,.2);letter-spacing:2px;font-weight:500;font-size:14px}
        .g-code-input:focus{border-color:rgba(80,124,128,.8);background:rgba(80,124,128,.07);box-shadow:0 0 0 4px rgba(80,124,128,.12)}
        .g-code-input.err{border-color:rgba(255,120,100,.6);box-shadow:0 0 0 4px rgba(255,120,100,.08)}
        .g-code-input.ok{border-color:rgba(46,160,67,.6);box-shadow:0 0 0 4px rgba(46,160,67,.08)}

        .g-err-txt{font-size:12px;font-weight:700;color:#ff8a80;text-align:center;min-height:20px;margin:8px 0 0;animation:errShake .3s cubic-bezier(.36,.07,.19,.97)}
        @keyframes errShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}

        .g-submit{margin-top:14px;width:100%;padding:16px;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:800;cursor:pointer;position:relative;overflow:hidden;transition:opacity .2s,transform .2s;letter-spacing:.2px}
        .g-submit:not(:disabled){background:linear-gradient(135deg,#507c80 0%,#3a5c60 100%);color:#fff;box-shadow:0 4px 20px rgba(80,124,128,.4)}
        .g-submit:not(:disabled):hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(80,124,128,.5)}
        .g-submit:not(:disabled):active{transform:translateY(0)}
        .g-submit:disabled{background:rgba(255,255,255,.07);color:rgba(255,255,255,.3);cursor:default}
        .g-submit::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.1) 50%,transparent 100%);transform:translateX(-100%);transition:transform .5s ease}
        .g-submit:not(:disabled):hover::after{transform:translateX(100%)}

        .g-hint{font-size:11px;color:rgba(255,255,255,.18);text-align:center;margin-top:14px;line-height:1.7}
        .g-sep{height:1px;background:rgba(255,255,255,.07);margin:20px 0}
        .g-no-code{text-align:center;font-size:12px;color:rgba(255,255,255,.28);line-height:1.6}
        .g-no-code a{color:rgba(80,124,128,.8);text-decoration:none;font-weight:700}
        .g-no-code a:hover{color:#6ab8bd}

        @media(max-width:800px){
          .g-left{display:none}
          .g-body{padding:16px 16px 36px}
        }
      `}</style>
      <div className="g-root">
        <div className="g-grid"/>
        <div className="g-orb g-orb-tl"/><div className="g-orb g-orb-br"/><div className="g-orb g-orb-mid"/>
        <div className="g-dot g-dot-1"/><div className="g-dot g-dot-2"/><div className="g-dot g-dot-3"/><div className="g-dot g-dot-4"/><div className="g-dot g-dot-5"/>

        <nav className="g-nav">
          <a href="/tools" className="g-nav-brand"><div className="g-nav-dot"/><span className="g-nav-label">Prowess Digital Solutions</span></a>
          <a href="/tools" className="g-nav-back">← All Tools</a>
        </nav>

        <div className="g-body">
          <div className="g-split">

            <div className="g-left">
              <div className="g-tag"><span className="g-tag-pulse"/><span>Premium Tool</span></div>
              <h1 className="g-headline">Stop guessing.<br/><span className="hi">Know your numbers.</span></h1>
              <p className="g-body-txt">Most businesses fail not because they lacked effort, but because they started without knowing the real cost of what they were building. This calculator changes that.</p>
              <div className="g-pills">
                {[
                  {icon:"💰",title:"Startup Cost Planner",sub:"See exactly what it costs before you commit"},
                  {icon:"⚖️",title:"Break-Even Calculator",sub:"Know when you stop losing and start winning"},
                  {icon:"🏷️",title:"Pricing Builder",sub:"Set prices that actually cover your costs"},
                  {icon:"📈",title:"Funding Tracker",sub:"Map your funding needs against your goals"},
                ].map((f,i)=>(
                  <div key={i} className="g-pill">
                    <div className="g-pill-icon">{f.icon}</div>
                    <div className="g-pill-text"><span className="g-pill-title">{f.title}</span><span className="g-pill-sub">{f.sub}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="g-card">
              <div className="g-card-inner">
                <div className="g-card-glow"/>
                <div className="g-card-eyebrow">Client Access</div>
                <div className="g-card-title">Startup Calculator</div>
                <div className="g-card-sub">Enter your Prowess Digital Solutions access code to unlock the full tool.</div>

                <span className="g-code-label">Your access code</span>
                <div className="g-code-wrap">
                  <input
                    value={code}
                    placeholder="PDS-XXXX-XXXX"
                    onChange={e=>{setCode(e.target.value.toUpperCase());setStatus("idle");}}
                    onKeyDown={e=>e.key==="Enter"&&verify()}
                    disabled={status==="checking"}
                    autoComplete="off"
                    className={`g-code-input${status==="denied"?" err":status==="granted"?" ok":""}`}
                  />
                </div>
                <div className="g-err-txt">{status==="denied"?(REASON_MSG[reason]??REASON_MSG.invalid):""}</div>

                <button onClick={verify} disabled={status==="checking"||!code.trim()} className="g-submit">
                  {status==="checking"?"Verifying your code...":"Unlock Calculator →"}
                </button>

                <p className="g-hint">Your access code was provided when you engaged with Prowess Digital Solutions. Keep it safe.</p>
                <div className="g-sep"/>
                <div className="g-no-code">No code yet? <a href="/contact">Get in touch</a> to become a client.</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

