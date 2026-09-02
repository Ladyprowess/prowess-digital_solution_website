"use client";
import { useState, useEffect, useCallback } from "react";

const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";
const COUNTRIES=[["Algeria","DA"],["Angola","Kz"],["Benin","CFA"],["Botswana","P"],["Burkina Faso","CFA"],["Burundi","Fr"],["Cabo Verde","Esc"],["Cameroon","CFA"],["Central African Republic","CFA"],["Chad","CFA"],["Comoros","Fr"],["Congo DR","FC"],["Congo Republic","CFA"],["Côte d'Ivoire","CFA"],["Djibouti","Fr"],["Egypt","E£"],["Equatorial Guinea","CFA"],["Eritrea","Nfk"],["Eswatini","L"],["Ethiopia","Br"],["Gabon","CFA"],["Gambia","D"],["Ghana","GH₵"],["Guinea","Fr"],["Guinea-Bissau","CFA"],["Kenya","KSh"],["Lesotho","L"],["Liberia","L$"],["Libya","LD"],["Madagascar","Ar"],["Malawi","MK"],["Mali","CFA"],["Mauritania","UM"],["Mauritius","₨"],["Morocco","MAD"],["Mozambique","MT"],["Namibia","N$"],["Niger","CFA"],["Nigeria","₦"],["Rwanda","Fr"],["São Tomé and Príncipe","Db"],["Senegal","CFA"],["Seychelles","₨"],["Sierra Leone","Le"],["Somalia","Sh"],["South Africa","R"],["South Sudan","£"],["Sudan","£"],["Tanzania","TSh"],["Togo","CFA"],["Tunisia","DT"],["Uganda","USh"],["Zambia","ZK"],["Zimbabwe","Z$"]];
const getSym=(c:string)=>(COUNTRIES.find(x=>x[0]===c)||["","₦"])[1];
const mkid=()=>Math.random().toString(36).slice(2,9);
const num=(v:unknown)=>{const x=parseFloat(String(v||"").replace(/,/g,""));return isNaN(x)?0:x;};
const fmt2=(n:number,sym:string)=>`${sym}${n.toLocaleString("en",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const todayStr=()=>new Date().toISOString().split("T")[0];
const fmtDate=(d:string)=>{if(!d)return"";try{return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}catch{return d;}};

// ── Mobile hook ───────────────────────────────────────────────────────────
function useIsMobile(){
  const [mob,setMob]=useState(false);
  useEffect(()=>{
    const chk=()=>setMob(window.innerWidth<640);
    chk();
    window.addEventListener("resize",chk);
    return()=>window.removeEventListener("resize",chk);
  },[]);
  return mob;
}

interface LineItem{id:string;desc:string;qty:string;price:string;}
interface Invoice{id:string;number:string;date:string;dueDate:string;status:"unpaid"|"paid";bizName:string;bizPhone:string;bizEmail:string;bizAddress:string;bizBank:string;clientName:string;clientPhone:string;clientEmail:string;clientAddress:string;items:LineItem[];taxRate:string;notes:string;sym:string;createdAt:string;}
interface Profile{name:string;phone:string;email:string;address:string;bank:string;country:string;}

const blankProfile=():Profile=>({name:"",phone:"",email:"",address:"",bank:"",country:"Nigeria"});
const blankInvoice=(p:Profile,count:number):Invoice=>({
  id:mkid(),number:`INV-${String(count+1).padStart(4,"0")}`,
  date:todayStr(),dueDate:"",status:"unpaid",
  bizName:p.name,bizPhone:p.phone,bizEmail:p.email,bizAddress:p.address,bizBank:p.bank,
  clientName:"",clientPhone:"",clientEmail:"",clientAddress:"",
  items:[{id:mkid(),desc:"",qty:"1",price:""}],taxRate:"",notes:"",
  sym:getSym(p.country)||"₦",createdAt:new Date().toISOString(),
});
const subTotal=(items:LineItem[])=>items.reduce((a,i)=>a+num(i.qty)*num(i.price),0);
const invTotal=(inv:Invoice)=>{const s=subTotal(inv.items);return s+s*(num(inv.taxRate)/100);};
const isOverdue=(inv:Invoice)=>inv.status==="unpaid"&&!!inv.dueDate&&new Date(inv.dueDate)<new Date(todayStr());

const card:React.CSSProperties={background:W,borderRadius:14,padding:"20px 22px",boxShadow:"0 1px 6px rgba(58,92,96,.10)",border:`1.5px solid ${MGRAY}`,marginBottom:16};
const TH:React.CSSProperties={background:B,color:W,padding:"9px 12px",fontWeight:700,fontSize:12,textAlign:"left",whiteSpace:"nowrap"};
const TD=(a:boolean):React.CSSProperties=>({padding:"7px 10px",fontSize:13,color:DARK,background:a?LGRAY:W,borderBottom:`1px solid ${LGRAY}`});

// ── Print Invoice ─────────────────────────────────────────────────────────
function printInvoice(inv:Invoice){
  const sym=inv.sym||"₦";
  const sub=subTotal(inv.items);
  const tax=sub*(num(inv.taxRate)/100);
  const total=sub+tax;
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Invoice ${inv.number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a;background:#fff;padding:48px 52px;}
  .wrap{max-width:720px;margin:0 auto;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:3px solid #507c80;}
  .biz-name{font-size:24px;font-weight:800;color:#507c80;margin-bottom:5px;}
  .biz-info{font-size:12px;color:#555;line-height:1.9;}
  .inv-right{text-align:right;}
  .inv-label{font-size:30px;font-weight:800;color:#507c80;letter-spacing:-1px;}
  .inv-meta{font-size:12px;color:#555;text-align:right;line-height:1.9;margin-top:4px;}
  .status-badge{display:inline-block;padding:4px 13px;border-radius:99px;font-size:11px;font-weight:700;margin-top:8px;
    background:${inv.status==="paid"?"#e8f5e9":"#fff7ed"};
    color:${inv.status==="paid"?"#2e7d32":"#c2410c"};
    border:1px solid ${inv.status==="paid"?"#a5d6a7":"#fed7aa"};}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:30px;padding:18px 20px;background:#f7fafa;border-radius:10px;}
  .party-label{font-size:10px;font-weight:700;color:#507c80;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;}
  .party-name{font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:3px;}
  .party-info{font-size:12px;color:#555;line-height:1.8;}
  table{width:100%;border-collapse:collapse;margin-bottom:22px;}
  thead tr{background:#507c80;}
  thead th{color:#fff;padding:10px 13px;font-size:12px;font-weight:700;text-align:left;}
  thead th.r{text-align:right;}
  thead th.c{text-align:center;}
  tbody tr:nth-child(even){background:#f7fafa;}
  tbody td{padding:9px 13px;font-size:13px;color:#1a1a1a;border-bottom:1px solid #edf1f1;}
  tbody td.r{text-align:right;}
  tbody td.c{text-align:center;}
  .totals{display:flex;justify-content:flex-end;margin-bottom:24px;}
  .totals-box{width:270px;background:#f7fafa;border-radius:10px;padding:16px 18px;}
  .totals-row{display:flex;justify-content:space-between;font-size:13px;color:#555;margin-bottom:7px;}
  .totals-row span:last-child{font-weight:600;color:#3a5c60;}
  .totals-total{display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1a1a1a;border-top:2px solid #507c80;padding-top:11px;margin-top:8px;}
  .totals-total span:last-child{color:#507c80;}
  .bank-section{margin-bottom:18px;padding:14px 16px;background:#f7fafa;border-radius:10px;border-left:4px solid #507c80;}
  .bank-label{font-size:10px;font-weight:700;color:#507c80;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
  .bank-val{font-size:13px;color:#1a1a1a;font-weight:600;}
  .notes-section{font-size:12px;color:#555;line-height:1.8;padding:12px 16px;background:#fffbf0;border-radius:10px;border-left:4px solid #f0c060;margin-bottom:18px;}
  .footer{text-align:center;margin-top:36px;padding-top:20px;border-top:1px solid #e0e8e8;font-size:12px;color:#507c80;font-weight:700;letter-spacing:.5px;}
  @media print{body{padding:24px;} @page{margin:1cm;}}
</style></head><body>
<div class="wrap">
  <div class="header">
    <div>
      <div class="biz-name">${inv.bizName||"Your Business"}</div>
      <div class="biz-info">
        ${inv.bizPhone?`${inv.bizPhone}<br/>`:""}
        ${inv.bizEmail?`${inv.bizEmail}<br/>`:""}
        ${inv.bizAddress||""}
      </div>
    </div>
    <div class="inv-right">
      <div class="inv-label">INVOICE</div>
      <div class="inv-meta">
        <strong>${inv.number}</strong><br/>
        Date: ${fmtDate(inv.date)}<br/>
        ${inv.dueDate?`Due: ${fmtDate(inv.dueDate)}<br/>`:""}
      </div>
      <div><span class="status-badge">${inv.status==="paid"?"PAID":"UNPAID"}</span></div>
    </div>
  </div>
  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">${inv.bizName||""}</div>
      <div class="party-info">${[inv.bizPhone,inv.bizEmail,inv.bizAddress].filter(Boolean).join("<br/>")}</div>
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${inv.clientName}</div>
      <div class="party-info">${[inv.clientPhone,inv.clientEmail,inv.clientAddress].filter(Boolean).join("<br/>")}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Description</th><th class="c">Qty</th><th class="r">Unit Price</th><th class="r">Total</th>
    </tr></thead>
    <tbody>
      ${inv.items.map(i=>`<tr>
        <td>${i.desc||"-"}</td>
        <td class="c">${i.qty}</td>
        <td class="r">${fmt2(num(i.price),sym)}</td>
        <td class="r">${fmt2(num(i.qty)*num(i.price),sym)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="totals"><div class="totals-box">
    <div class="totals-row"><span>Subtotal</span><span>${fmt2(sub,sym)}</span></div>
    ${num(inv.taxRate)>0?`<div class="totals-row"><span>Tax (${inv.taxRate}%)</span><span>${fmt2(tax,sym)}</span></div>`:""}
    <div class="totals-total"><span>TOTAL DUE</span><span>${fmt2(total,sym)}</span></div>
  </div></div>
  ${inv.bizBank?`<div class="bank-section"><div class="bank-label">Payment Details</div><div class="bank-val">${inv.bizBank}</div></div>`:""}
  ${inv.notes?`<div class="notes-section">${inv.notes}</div>`:""}
  <div class="footer">Thank you for your business &mdash; ${inv.bizName||"Prowess Digital Solutions"}</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
  const w=window.open("","_blank");
  if(w){w.document.write(html);w.document.close();}
}

// ── Form Input ────────────────────────────────────────────────────────────
function FI({label,val,set,ph="",type="text",right=false}:{label?:string,val:unknown,set:(v:string)=>void,ph?:string,type?:string,right?:boolean}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
    <input type={type} value={String(val||"")} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)}
      style={{padding:"9px 12px",border:`1.5px solid ${f?B:MGRAY}`,borderRadius:9,fontSize:14,width:"100%",outline:"none",boxSizing:"border-box",textAlign:right?"right":"left",background:W,color:DARK}}/>
  </div>;
}

function FSel({label,val,set}:{label?:string,val:string,set:(v:string)=>void}){
  return <div style={{marginBottom:12}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
    <select value={val} onChange={e=>set(e.target.value)} style={{padding:"9px 12px",border:`1.5px solid ${MGRAY}`,borderRadius:9,fontSize:14,width:"100%",outline:"none",background:W,color:DARK}}>
      {COUNTRIES.map(([n])=><option key={n} value={n}>{n}</option>)}
    </select>
  </div>;
}

function KPI({label,val,sub,accent,warn,green}:{label:string,val:string,sub?:string,accent?:boolean,warn?:boolean,green?:boolean}){
  const bg=warn?"#fdecea":green?"#e8f5e9":accent?B:LITE,tc=warn?"#c0392b":green?"#2e7d32":accent?W:DARK,sc=warn?"#c0392b":green?"#388e3c":accent?"rgba(255,255,255,.7)":MID;
  return <div style={{background:bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${warn?"#f5c6cb":green?"#a5d6a7":accent?DARK:MGRAY}`}}>
    <div style={{fontSize:10,fontWeight:700,color:sc,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontWeight:800,color:tc}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:sc,marginTop:3}}>{sub}</div>}
  </div>;
}

// ── Profile Tab ───────────────────────────────────────────────────────────
function ProfileTab({p,sp,onSave}:{p:Profile,sp:(x:Profile)=>void,onSave:()=>void}){
  const mob=useIsMobile();
  const u=(f:keyof Profile,v:string)=>sp({...p,[f]:v});
  return <div style={card}>
    <div style={{fontWeight:800,fontSize:15,color:DARK,marginBottom:16,paddingBottom:10,borderBottom:`1.5px solid ${LGRAY}`}}>Your Business Profile</div>
    <p style={{fontSize:13,color:MID,marginBottom:16,lineHeight:1.6}}>This information fills every new invoice automatically. Set it once.</p>
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
      <FI label="Business Name" val={p.name} set={v=>u("name",v)} ph="e.g. Adunola Fabrics"/>
      <FI label="Phone Number" val={p.phone} set={v=>u("phone",v)} ph="+234 801 234 5678 (with country code)" type="tel"/>
      <FI label="Email Address" val={p.email} set={v=>u("email",v)} ph="e.g. hello@yourbiz.com" type="email"/>
      <FI label="Business Address" val={p.address} set={v=>u("address",v)} ph="e.g. 12 Lagos Island"/>
    </div>
    <FI label="Bank / Payment Details" val={p.bank} set={v=>u("bank",v)} ph="e.g. GTBank: 0123456789"/>
    <FSel label="Country / Currency" val={p.country} set={v=>u("country",v)}/>
    <button onClick={onSave} style={{padding:"10px 20px",background:B,border:"none",borderRadius:9,color:W,fontSize:14,fontWeight:800,cursor:"pointer"}}>Save Profile</button>
  </div>;
}

// ── Create Invoice ────────────────────────────────────────────────────────
function CreateTab({profile,invoices,onSave,onCancel}:{profile:Profile,invoices:Invoice[],onSave:(inv:Invoice)=>void,onCancel:()=>void}){
  const mob=useIsMobile();
  const [inv,setInv]=useState<Invoice>(()=>blankInvoice(profile,invoices.length));
  const u=(f:keyof Invoice,v:string)=>setInv(p=>({...p,[f]:v}));
  const uItem=(id:string,f:keyof LineItem,v:string)=>setInv(p=>({...p,items:p.items.map(i=>i.id===id?{...i,[f]:v}:i)}));
  const addItem=()=>setInv(p=>({...p,items:[...p.items,{id:mkid(),desc:"",qty:"1",price:""}]}));
  const delItem=(id:string)=>{if(inv.items.length>1)setInv(p=>({...p,items:p.items.filter(i=>i.id!==id)}));};
  const sub=subTotal(inv.items);
  const tax=sub*(num(inv.taxRate)/100);
  const total=sub+tax;
  const sym=inv.sym||"₦";
  const save=()=>{
    if(!inv.clientName.trim()){alert("Please enter a client name.");return;}
    if(!inv.items.some(i=>i.desc.trim())){alert("Please add at least one item.");return;}
    onSave(inv);
  };
  return <div>
    {/* Header bar */}
    <div style={{...card,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
      <div><div style={{fontSize:15,fontWeight:800,color:DARK}}>New Invoice</div><div style={{fontSize:12,color:MID,marginTop:2}}>{inv.number}</div></div>
      <button onClick={onCancel} style={{padding:"7px 14px",background:LGRAY,border:`1.5px solid ${MGRAY}`,borderRadius:8,color:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
    </div>

    {/* Invoice Details */}
    <div style={card}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Invoice Details</div>
      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr 1fr",gap:14}}>
        <FI label="Invoice Number" val={inv.number} set={v=>u("number",v)}/>
        <FI label="Invoice Date" val={inv.date} set={v=>u("date",v)} type="date"/>
        <FI label="Due Date" val={inv.dueDate} set={v=>u("dueDate",v)} type="date"/>
      </div>
    </div>

    {/* From / To - stacks on mobile */}
    <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:14}}>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>From; Your Business</div>
        <FI label="Business Name" val={inv.bizName} set={v=>u("bizName",v)}/>
        <FI label="Phone" val={inv.bizPhone} set={v=>u("bizPhone",v)} ph="+234 801 234 5678 (with country code)" type="tel"/>
        <FI label="Email" val={inv.bizEmail} set={v=>u("bizEmail",v)} type="email"/>
        <FI label="Address" val={inv.bizAddress} set={v=>u("bizAddress",v)}/>
        <FI label="Bank / Payment Details" val={inv.bizBank} set={v=>u("bizBank",v)} ph="Bank name + account number"/>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>To; Your Client</div>
        <FI label="Client Name *" val={inv.clientName} set={v=>u("clientName",v)} ph="Person or business name"/>
        <FI label="Phone Number" val={inv.clientPhone} set={v=>u("clientPhone",v)} ph="+234 801 234 5678 (with country code)" type="tel"/>
        <FI label="Email Address" val={inv.clientEmail} set={v=>u("clientEmail",v)} type="email"/>
        <FI label="Address (optional)" val={inv.clientAddress} set={v=>u("clientAddress",v)}/>
      </div>
    </div>

    {/* Items / Services */}
    <div style={card}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Items / Services</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
        <thead><tr>
          <th style={{...TH,minWidth:180}}>Description</th>
          <th style={{...TH,width:70,textAlign:"center" as const}}>Qty</th>
          <th style={{...TH,width:120,textAlign:"right" as const}}>Unit Price ({sym})</th>
          <th style={{...TH,width:110,textAlign:"right" as const}}>Total ({sym})</th>
          <th style={{...TH,width:36}}></th>
        </tr></thead>
        <tbody>{inv.items.map((item,i)=><tr key={item.id} style={{background:i%2===0?W:LGRAY}}>
          <td style={TD(i%2===1)}><input value={item.desc} onChange={e=>uItem(item.id,"desc",e.target.value)} placeholder="What did you provide?" style={{padding:"7px 9px",border:`1.5px solid ${MGRAY}`,borderRadius:7,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box"}}/></td>
          <td style={TD(i%2===1)}><input type="number" value={item.qty} onChange={e=>uItem(item.id,"qty",e.target.value)} style={{padding:"7px 6px",border:`1.5px solid ${MGRAY}`,borderRadius:7,fontSize:13,width:"100%",outline:"none",textAlign:"center"}}/></td>
          <td style={TD(i%2===1)}><input type="number" value={item.price} onChange={e=>uItem(item.id,"price",e.target.value)} placeholder="0.00" style={{padding:"7px 9px",border:`1.5px solid ${MGRAY}`,borderRadius:7,fontSize:13,width:"100%",outline:"none",textAlign:"right"}}/></td>
          <td style={{...TD(i%2===1),textAlign:"right",fontWeight:700,color:B}}>{fmt2(num(item.qty)*num(item.price),sym)}</td>
          <td style={TD(i%2===1)}><button onClick={()=>delItem(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e74c3c",fontSize:17,padding:"0 4px"}}>x</button></td>
        </tr>)}</tbody>
      </table></div>
      <button onClick={addItem} style={{marginTop:10,padding:"7px 14px",background:"transparent",border:`1.5px dashed ${MID}`,borderRadius:8,color:MID,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Add Item</button>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <div style={{width:mob?"100%":"280px",background:LGRAY,borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:DARK,marginBottom:8}}><span>Subtotal</span><span>{fmt2(sub,sym)}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:13,color:DARK,flexShrink:0}}>Tax %</span>
            <input type="number" value={inv.taxRate} onChange={e=>u("taxRate",e.target.value)} placeholder="0"
              style={{flex:1,padding:"5px 8px",border:`1.5px solid ${MGRAY}`,borderRadius:7,fontSize:13,outline:"none",textAlign:"right"}}/>
            <span style={{fontSize:13,color:MID,flexShrink:0}}>{fmt2(tax,sym)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",borderTop:`1.5px solid ${MGRAY}`,paddingTop:10,fontWeight:800,fontSize:15,color:DARK}}><span>TOTAL DUE</span><span style={{color:B}}>{fmt2(total,sym)}</span></div>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div style={card}>
      <div style={{fontSize:13,fontWeight:800,color:DARK,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Notes / Terms (optional)</div>
      <textarea value={inv.notes} onChange={e=>u("notes",e.target.value)} placeholder="e.g. Payment due within 7 days. Thank you for your business." rows={3}
        style={{padding:"10px 12px",border:`1.5px solid ${MGRAY}`,borderRadius:9,fontSize:13,width:"100%",outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
    </div>

    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginBottom:32,flexWrap:"wrap"}}>
      <button onClick={onCancel} style={{padding:"10px 20px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:9,color:MID,fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button>
      <button onClick={save} style={{padding:"10px 22px",background:B,border:"none",borderRadius:9,color:W,fontSize:14,fontWeight:800,cursor:"pointer"}}>Save Invoice</button>
    </div>
  </div>;
}

// ── Invoice Card ──────────────────────────────────────────────────────────
function InvCard({inv,onMarkPaid,onDelete}:{inv:Invoice,onMarkPaid:(id:string)=>void,onDelete:(id:string)=>void}){
  const [open,setOpen]=useState(false);
  const mob=useIsMobile();
  const overdue=isOverdue(inv);
  const total=invTotal(inv);
  const sym=inv.sym||"₦";
  const label=inv.status==="paid"?"Paid":overdue?"Overdue":"Unpaid";
  const sc=inv.status==="paid"?{bg:"#e8f5e9",c:"#2e7d32",b:"#a5d6a7"}:overdue?{bg:"#fdecea",c:"#c0392b",b:"#f5c6cb"}:{bg:"#fff7ed",c:"#c2410c",b:"#fed7aa"};
  const reminderMsg=`Hello ${inv.clientName}, this is a reminder that Invoice ${inv.number} for ${fmt2(total,sym)} from ${inv.bizName} is${overdue?" overdue; it was":" due"} on ${fmtDate(inv.dueDate)||"the agreed date"}. Please make payment at your earliest convenience.\n\n${inv.bizBank?`Payment: ${inv.bizBank}\n\n`:""}Thank you.\n${inv.bizName}`;
  const waLink=inv.clientPhone?`https://wa.me/${inv.clientPhone.replace(/\D/g,"")}?text=${encodeURIComponent(reminderMsg)}`:"";
  const mailLink=inv.clientEmail?`mailto:${inv.clientEmail}?subject=${encodeURIComponent(`Payment Reminder: Invoice ${inv.number}`)}&body=${encodeURIComponent(reminderMsg)}`:"";

  return <div style={{...card,cursor:"pointer",marginBottom:10}} onClick={()=>setOpen(o=>!o)}>
    {/* Summary row */}
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontWeight:800,fontSize:14,color:DARK}}>{inv.number}</span>
          <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:sc.bg,color:sc.c,border:`1px solid ${sc.b}`}}>{label}</span>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:2}}>{inv.clientName}</div>
        <div style={{fontSize:12,color:MID}}>{fmtDate(inv.date)}{inv.dueDate?` · Due ${fmtDate(inv.dueDate)}`:""}</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:17,fontWeight:800,color:B}}>{fmt2(total,sym)}</div>
        <div style={{fontSize:12,color:MID,marginTop:2}}>{inv.items.length} item{inv.items.length!==1?"s":""} · {open?"▲":"▼"}</div>
      </div>
    </div>

    {/* Expanded panel */}
    {open&&<div onClick={e=>e.stopPropagation()} style={{marginTop:14}}>

      {/* Details summary */}
      <div style={{background:LGRAY,borderRadius:10,padding:14,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:B,textTransform:"uppercase",marginBottom:4}}>From</div>
            <div style={{fontSize:13,fontWeight:700,color:DARK}}>{inv.bizName}</div>
            {inv.bizPhone&&<div style={{fontSize:12,color:MID}}>{inv.bizPhone}</div>}
            {inv.bizEmail&&<div style={{fontSize:12,color:MID}}>{inv.bizEmail}</div>}
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:B,textTransform:"uppercase",marginBottom:4}}>To</div>
            <div style={{fontSize:13,fontWeight:700,color:DARK}}>{inv.clientName}</div>
            {inv.clientPhone&&<div style={{fontSize:12,color:MID}}>{inv.clientPhone}</div>}
            {inv.clientEmail&&<div style={{fontSize:12,color:MID}}>{inv.clientEmail}</div>}
          </div>
        </div>
        {inv.items.map(item=><div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${MGRAY}`,fontSize:13,gap:8}}>
          <span style={{color:DARK}}>{item.desc} <span style={{color:MID}}>x{item.qty}</span></span>
          <span style={{fontWeight:700,color:B}}>{fmt2(num(item.qty)*num(item.price),sym)}</span>
        </div>)}
        <div style={{textAlign:"right",marginTop:10}}>
          <div style={{fontSize:13,color:MID}}>Subtotal: {fmt2(subTotal(inv.items),sym)}</div>
          {num(inv.taxRate)>0&&<div style={{fontSize:13,color:MID}}>Tax ({inv.taxRate}%): {fmt2(subTotal(inv.items)*(num(inv.taxRate)/100),sym)}</div>}
          <div style={{fontWeight:800,fontSize:15,color:DARK,marginTop:4}}>Total: {fmt2(total,sym)}</div>
        </div>
        {inv.bizBank&&<div style={{marginTop:10,padding:"8px 10px",background:W,borderRadius:7,fontSize:12,color:DARK,border:`1px solid ${MGRAY}`}}><b style={{color:B}}>Payment:</b> {inv.bizBank}</div>}
        {inv.notes&&<div style={{marginTop:8,fontSize:12,color:MID,lineHeight:1.6}}>{inv.notes}</div>}
      </div>

      {/* ── Action buttons: two labelled groups ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>

        {/* Group 1: Remind client */}
        {(waLink||mailLink)&&<div>
          <div style={{fontSize:10,fontWeight:700,color:MID,textTransform:"uppercase",letterSpacing:.9,marginBottom:7}}>Remind Client</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {waLink&&<a href={waLink} target="_blank" rel="noopener"
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:"#25d366",borderRadius:9,color:W,fontSize:13,fontWeight:700,textDecoration:"none"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.86 14.16c-.25.7-1.45 1.34-2 1.42-.51.08-1.15.11-1.86-.12-.43-.13-.98-.31-1.68-.61-2.96-1.28-4.89-4.26-5.04-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.23.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.76.83 2.06.98.3.15.5.23.58.35.08.13.08.7-.17 1.4z"/></svg>
              <span>WhatsApp</span>
            </a>}
            {mailLink&&<a href={mailLink}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:9,color:DARK,fontSize:13,fontWeight:700,textDecoration:"none"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
              <span>Email</span>
            </a>}
          </div>
        </div>}

        {/* Group 2: Manage */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:MID,textTransform:"uppercase",letterSpacing:.9,marginBottom:7}}>Manage Invoice</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {inv.status==="unpaid"&&<button onClick={()=>onMarkPaid(inv.id)}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:"#e8f5e9",border:"1.5px solid #a5d6a7",borderRadius:9,color:"#2e7d32",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              <span>Mark as Paid</span>
            </button>}
            <button onClick={()=>printInvoice(inv)}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:LITE,border:`1.5px solid ${MGRAY}`,borderRadius:9,color:DARK,fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.318 2.647a.75.75 0 01-.44.807 4.13 4.13 0 01-1.928.421H8.39c-.677 0-1.298-.166-1.928-.42a.75.75 0 01-.44-.808L6.34 18m11.32 0H6.34m0-10.5v-3.375c0-.621.504-1.125 1.125-1.125h9.06c.621 0 1.125.504 1.125 1.125V7.5m-11.31 0h11.31m-11.31 0h-.75A2.25 2.25 0 003 9.75v6a2.25 2.25 0 002.25 2.25h.75m11.31-8.25h.75A2.25 2.25 0 0121 9.75v6a2.25 2.25 0 01-2.25 2.25h-.75"/></svg>
              <span>Print Invoice</span>
            </button>
            <button onClick={()=>{if(window.confirm("Delete this invoice? This cannot be undone."))onDelete(inv.id);}}
              style={{display:"inline-flex",alignItems:"center",gap:7,padding:"9px 16px",background:"#fdecea",border:"1.5px solid #f5c6cb",borderRadius:9,color:"#c0392b",fontSize:13,fontWeight:700,cursor:"pointer",marginLeft:"auto"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              <span>Delete</span>
            </button>
          </div>
        </div>

      </div>
    </div>}
  </div>;
}

// ── Invoice List Tab ──────────────────────────────────────────────────────
function ListTab({invoices,profile,onMarkPaid,onDelete,onNew}:{invoices:Invoice[],profile:Profile,onMarkPaid:(id:string)=>void,onDelete:(id:string)=>void,onNew:()=>void}){
  const [filter,setFilter]=useState("all");
  const sym=getSym(profile.country)||"₦";
  const total=invoices.reduce((a,i)=>a+invTotal(i),0);
  const paid=invoices.filter(i=>i.status==="paid").reduce((a,i)=>a+invTotal(i),0);
  const unpaid=invoices.filter(i=>i.status==="unpaid"&&!isOverdue(i)).reduce((a,i)=>a+invTotal(i),0);
  const overdue=invoices.filter(i=>isOverdue(i)).reduce((a,i)=>a+invTotal(i),0);
  const filtered=invoices.filter(i=>filter==="all"||(filter==="paid"&&i.status==="paid")||(filter==="unpaid"&&i.status==="unpaid"&&!isOverdue(i))||(filter==="overdue"&&isOverdue(i)));
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
      <KPI label="Total Invoiced" val={fmt2(total,sym)} sub={`${invoices.length} invoices`}/>
      <KPI green label="Paid" val={fmt2(paid,sym)} sub={`${invoices.filter(i=>i.status==="paid").length} invoices`}/>
      <KPI warn={unpaid>0} label="Awaiting Payment" val={fmt2(unpaid,sym)}/>
      <KPI warn={overdue>0} label="Overdue" val={fmt2(overdue,sym)} sub={`${invoices.filter(i=>isOverdue(i)).length} overdue`}/>
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(["all","unpaid","paid","overdue"]).map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${filter===f?B:MGRAY}`,background:filter===f?B:W,color:filter===f?W:MID,fontSize:12,fontWeight:700,cursor:"pointer",textTransform:"capitalize" as const}}>{f}</button>)}
      </div>
      <button onClick={onNew} style={{padding:"8px 18px",background:B,border:"none",borderRadius:9,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ New Invoice</button>
    </div>
    {filtered.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:MID}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      </div>
      <div style={{fontSize:15,fontWeight:800,color:DARK,marginBottom:8}}>{invoices.length===0?"No invoices yet":"Nothing here"}</div>
      <p style={{fontSize:13,marginBottom:16}}>{invoices.length===0?"Create your first invoice to start tracking payments.":"Try a different filter."}</p>
      {invoices.length===0&&<button onClick={onNew} style={{padding:"10px 20px",background:B,border:"none",borderRadius:9,color:W,fontSize:14,fontWeight:700,cursor:"pointer"}}>Create First Invoice</button>}
    </div>:filtered.map(inv=><InvCard key={inv.id} inv={inv} onMarkPaid={onMarkPaid} onDelete={onDelete}/>)}
  </div>;
}

// ── Invoice Tool ──────────────────────────────────────────────────────────
function InvoiceTool({code,onSignOut}:{code:string,onSignOut:()=>void}){
  const [tab,setTab]=useState<"list"|"create"|"profile">("list");
  const [invoices,setInvoices]=useState<Invoice[]>([]);
  const [profile,setProfile]=useState<Profile>(blankProfile);
  const [loaded,setLoaded]=useState(false);
  const [saved,setSaved]=useState(false);
  const [saveTimer,setSaveTimer]=useState<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    async function load(){
      try{const res=await fetch(`/api/tools-data?code=${encodeURIComponent(code)}&tool=invoice`);if(res.ok){const j=await res.json();if(j.data){setInvoices(j.data.invoices||[]);setProfile(j.data.profile||blankProfile());setLoaded(true);return;}}}catch{}
      try{const s=localStorage.getItem("pds-invoice-data");if(s){const p=JSON.parse(s);setInvoices(p.invoices||[]);setProfile(p.profile||blankProfile());}}catch{}
      setLoaded(true);
    }
    load();
  },[code]);

  const save=useCallback((invs:Invoice[],prof:Profile)=>{
    const data={invoices:invs,profile:prof};
    try{localStorage.setItem("pds-invoice-data",JSON.stringify(data));}catch{}
    if(saveTimer)clearTimeout(saveTimer);
    const t=setTimeout(async()=>{try{await fetch("/api/tools-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,tool:"invoice",data})});}catch{}},1500);
    setSaveTimer(t);setSaved(true);setTimeout(()=>setSaved(false),1800);
  },[code,saveTimer]);

  const saveInvoice=(inv:Invoice)=>{const n=[inv,...invoices];setInvoices(n);save(n,profile);setTab("list");};
  const markPaid=(id:string)=>{const n=invoices.map(i=>i.id===id?{...i,status:"paid" as const}:i);setInvoices(n);save(n,profile);};
  const deleteInv=(id:string)=>{const n=invoices.filter(i=>i.id!==id);setInvoices(n);save(n,profile);};
  const saveProfile=()=>{save(invoices,profile);};

  if(!loaded)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:MID,fontSize:14}}>Loading your data...</div>;

  return <div style={{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
    <div style={{background:DARK,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:1.2,textTransform:"uppercase"}}>Prowess Digital Solutions · 2026</div>
        <div style={{fontSize:18,fontWeight:800,color:W,marginTop:2}}>Invoice Manager</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Prowess Digital Solutions</div>
        <div style={{fontSize:11,fontWeight:600,color:saved?"#81c784":"rgba(255,255,255,.4)",marginTop:2}}>{saved?"Saved":"Auto-saving..."}</div>
      </div>
    </div>
    <div style={{background:B,padding:"9px 22px",display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <a href="/tools" style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,textDecoration:"none"}}>{"<-"} Tools</a>
        <button onClick={onSignOut} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
      </div>
    </div>
    <div style={{background:W,borderBottom:`2px solid ${MGRAY}`,display:"flex",padding:"0 22px",overflowX:"auto"}}>
      {([["list","My Invoices"],["create","+ Create Invoice"],["profile","Business Profile"]] as [string,string][]).map(([v,l])=>
        <button key={v} onClick={()=>setTab(v as "list"|"create"|"profile")} style={{padding:"12px 17px",background:"transparent",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:tab===v?B:"#999",borderBottom:tab===v?`3px solid ${B}`:"3px solid transparent",marginBottom:-2}}>{l}</button>)}
    </div>
    <div style={{padding:"20px 22px",maxWidth:1100,margin:"0 auto"}}>
      {tab==="list"&&<ListTab invoices={invoices} profile={profile} onMarkPaid={markPaid} onDelete={deleteInv} onNew={()=>setTab("create")}/>}
      {tab==="create"&&<CreateTab profile={profile} invoices={invoices} onSave={saveInvoice} onCancel={()=>setTab("list")}/>}
      {tab==="profile"&&<ProfileTab p={profile} sp={setProfile} onSave={saveProfile}/>}
    </div>
    <div style={{textAlign:"center",padding:"14px",fontSize:12,color:"#aaa"}}>© 2026 Prowess Digital Solutions · prowessdigitalsolutions.com</div>
  </div>;
}

// ── Access Gate ────────────────────────────────────────────────────────────
const REASON_MSG:Record<string,string>={
  invalid:"That code is not recognised. Please check and try again.",
  revoked:"This access code has been revoked. Please contact Prowess Digital Solutions.",
  expired:"This access code has expired. Please contact Prowess Digital Solutions to renew.",
  not_included:"Your current plan does not include this tool. Upgrade your membership to unlock it.",
};

export default function InvoicePageClient(){
  const [code,setCode]=useState("");
  const [grantedCode,setGrantedCode]=useState<string|null>(null);
  const [status,setStatus]=useState<"idle"|"checking"|"denied"|"granted">("idle");
  const [reason,setReason]=useState("");

  useEffect(()=>{
    const raw=localStorage.getItem("pds-access-invoice");
    if(!raw)return;
    try{const saved=JSON.parse(raw) as {code:string};silentVerify(saved.code);}
    catch{localStorage.removeItem("pds-access-invoice");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function silentVerify(savedCode:string){
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:savedCode,tool:"invoice"})});
      const data=await res.json();
      if(data.valid){setGrantedCode(savedCode);setStatus("granted");localStorage.setItem("pds-access-invoice",JSON.stringify({code:savedCode}));}
      else if(data.reason==="not_included"){setCode(savedCode);setReason("not_included");setStatus("denied");}else{localStorage.removeItem("pds-access-invoice");}
    }catch{localStorage.removeItem("pds-access-invoice");}
  }

  async function verify(){
    setStatus("checking");
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim(),tool:"invoice"})});
      const data=await res.json();
      if(data.valid){const c=code.trim().toUpperCase();setGrantedCode(c);setStatus("granted");localStorage.setItem("pds-access-invoice",JSON.stringify({code:c}));}
      else{setReason(data.reason??"invalid");setStatus("denied");localStorage.removeItem("pds-access-invoice");}
    }catch{setReason("invalid");setStatus("denied");}
  }

  function signOut(){localStorage.removeItem("pds-access-invoice");setGrantedCode(null);setCode("");setStatus("idle");}

  if(grantedCode)return <InvoiceTool code={grantedCode} onSignOut={signOut}/>;

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
      .g-pill:nth-child(1){animation-delay:.15s}.g-pill:nth-child(2){animation-delay:.25s}.g-pill:nth-child(3){animation-delay:.35s}.g-pill:nth-child(4){animation-delay:.45s}.g-pill:nth-child(5){animation-delay:.55s}
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
        <a href="/tools" className="g-nav-back">{"<-"} All Tools</a>
      </nav>
      <div className="g-body">
        <div className="g-split">
          <div className="g-left">
            <div className="g-tag"><span className="g-tag-pulse"/><span>Premium Tool</span></div>
            <h1 className="g-headline">Get paid faster.<br/><span className="hi">Track every invoice.</span></h1>
            <p className="g-body-txt">Stop chasing payments with no paper trail. Create professional invoices, see who has paid and who has not, and send reminders in one tap.</p>
            <div className="g-pills">
              {[
                {icon:"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",title:"Professional Invoices",sub:"Create and send in under 2 minutes"},
                {icon:"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",title:"Payment Status",sub:"Paid, unpaid, and overdue at a glance"},
                {icon:"M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",title:"WhatsApp Reminder",sub:"One tap sends the reminder to the client"},
                {icon:"M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",title:"Email Reminder",sub:"Opens email ready to send"},
                {icon:"M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.318 2.647a.75.75 0 01-.44.807 4.13 4.13 0 01-1.928.421H8.39c-.677 0-1.298-.166-1.928-.42a.75.75 0 01-.44-.808L6.34 18m11.32 0H6.34m0-10.5v-3.375c0-.621.504-1.125 1.125-1.125h9.06c.621 0 1.125.504 1.125 1.125V7.5m-11.31 0h11.31m-11.31 0h-.75A2.25 2.25 0 003 9.75v6a2.25 2.25 0 002.25 2.25h.75m11.31-8.25h.75A2.25 2.25 0 0121 9.75v6a2.25 2.25 0 01-2.25 2.25h-.75",title:"Print-Ready Invoices",sub:"Beautiful printed invoice to share with clients"},
              ].map((f,i)=>(
                <div key={i} className="g-pill"><div className="g-pill-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={f.icon}/></svg></div><div className="g-pill-text"><span className="g-pill-title">{f.title}</span><span className="g-pill-sub">{f.sub}</span></div></div>
              ))}
            </div>
          </div>
          <div className="g-card">
            <div className="g-card-inner">
              <div className="g-card-glow"/>
              <div className="g-card-eyebrow">Client Access</div>
              <div className="g-card-title">Invoice Manager</div>
              <div className="g-card-sub">Enter your Prowess Digital Solutions access code to unlock.</div>
              <span className="g-code-label">Your access code</span>
              <input value={code} placeholder="PDS-XXXX-XXXX" onChange={e=>{setCode(e.target.value.toUpperCase());setStatus("idle");}} onKeyDown={e=>e.key==="Enter"&&verify()} disabled={status==="checking"} autoComplete="off" className={`g-code-input${status==="denied"?" err":""}`}/>
              <div className="g-err-txt">{status==="denied"?(<>{REASON_MSG[reason]??REASON_MSG.invalid}{reason==="not_included"&&<> <a href="/pricing" style={{color:"inherit",textDecoration:"underline"}}>View plans →</a></>}</>):""}</div>
              <button onClick={verify} disabled={status==="checking"||!code.trim()} className="g-submit">{status==="checking"?"Verifying your code...":"Unlock Invoice Manager"}</button>
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
