"use client";
import { useState, useEffect, useCallback } from "react";

const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";
const COUNTRIES=[["Algeria","DA"],["Angola","Kz"],["Benin","CFA"],["Botswana","P"],["Burkina Faso","CFA"],["Burundi","Fr"],["Cabo Verde","Esc"],["Cameroon","CFA"],["Central African Republic","CFA"],["Chad","CFA"],["Comoros","Fr"],["Congo DR","FC"],["Congo Republic","CFA"],["Côte d'Ivoire","CFA"],["Djibouti","Fr"],["Egypt","E£"],["Equatorial Guinea","CFA"],["Eritrea","Nfk"],["Eswatini","L"],["Ethiopia","Br"],["Gabon","CFA"],["Gambia","D"],["Ghana","GH₵"],["Guinea","Fr"],["Guinea-Bissau","CFA"],["Kenya","KSh"],["Lesotho","L"],["Liberia","L$"],["Libya","LD"],["Madagascar","Ar"],["Malawi","MK"],["Mali","CFA"],["Mauritania","UM"],["Mauritius","₨"],["Morocco","MAD"],["Mozambique","MT"],["Namibia","N$"],["Niger","CFA"],["Nigeria","₦"],["Rwanda","Fr"],["São Tomé and Príncipe","Db"],["Senegal","CFA"],["Seychelles","₨"],["Sierra Leone","Le"],["Somalia","Sh"],["South Africa","R"],["South Sudan","£"],["Sudan","£"],["Tanzania","TSh"],["Togo","CFA"],["Tunisia","DT"],["Uganda","USh"],["Zambia","ZK"],["Zimbabwe","Z$"]];
const getSym=(c:string)=>(COUNTRIES.find(x=>x[0]===c)||["","₦"])[1];
const mkid=()=>Math.random().toString(36).slice(2,9);
const num=(v:unknown)=>{const x=parseFloat(String(v||"").replace(/,/g,""));return isNaN(x)?0:x;};
const fmt=(v:unknown)=>{const x=Math.round(num(v));return x===0?"0":x.toLocaleString("en");};
const fmtPct=(v:unknown)=>v!==null&&v!==undefined?(num(v)*100).toFixed(1)+"%":" ";

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const INCOME_CATS=["Service Income","Product Sales","Deposit Received","Commission","Referral Bonus","Refund Received","Other Income"];
const EXPENSE_CATS=["Materials / Stock","Staff Wages","Rent / Premises","Transport","Phone & Data","Generator Fuel","Marketing","Equipment / Tools","Professional Fees","Loan Repayment","Packaging","Utilities","Insurance","Subscriptions","Tax / Government","Miscellaneous"];
const ALL_CATS=[...INCOME_CATS,...EXPENSE_CATS];

const card:React.CSSProperties={background:W,borderRadius:12,padding:"18px 22px",boxShadow:"0 1px 6px rgba(58,92,96,.10)",border:`1px solid ${MGRAY}`,marginBottom:14};
const TH:React.CSSProperties={background:B,color:W,padding:"9px 10px",fontWeight:700,fontSize:12,textAlign:"left",whiteSpace:"nowrap"};
const TD=(alt:boolean):React.CSSProperties=>({padding:"6px 8px",fontSize:13,color:DARK,background:alt?LGRAY:W,borderBottom:`1px solid ${LGRAY}`});

function Inp({val,set,ph="",type="text",right=false,sm=false}:{val:unknown,set:(v:string)=>void,ph?:string,type?:string,right?:boolean,sm?:boolean}){
  const [f,sf]=useState(false);
  return <input type={type} value={String(val||"")} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)}
    style={{padding:sm?"5px 7px":"8px 10px",border:`1.5px solid ${f?B:MGRAY}`,borderRadius:7,fontSize:sm?12:13,width:"100%",outline:"none",boxSizing:"border-box",textAlign:right?"right":"left"}}/>;
}
function Sel({val,set,opts,sm=false}:{val:unknown,set:(v:string)=>void,opts:string[],sm?:boolean}){
  return <select value={String(val||"")} onChange={e=>set(e.target.value)}
    style={{padding:sm?"5px 6px":"8px 10px",border:`1.5px solid ${MGRAY}`,borderRadius:7,fontSize:sm?12:13,width:"100%",outline:"none",background:W}}>
    <option value="">choose</option>
    {opts.map(o=><option key={o} value={o}>{o}</option>)}
  </select>;
}
function KPI({label,val,sub,accent,warn,green}:{label:string,val:string,sub?:string,accent?:boolean,warn?:boolean,green?:boolean}){
  const bg=warn?"#fdecea":green?"#e8f5e9":accent?B:LITE;
  const tc=warn?"#c0392b":green?"#2e7d32":accent?W:DARK;
  const sc=warn?"#c0392b":green?"#388e3c":accent?"rgba(255,255,255,.7)":MID;
  return <div style={{background:bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${warn?"#f5c6cb":green?"#a5d6a7":accent?DARK:MGRAY}`}}>
    <div style={{fontSize:10,fontWeight:700,color:sc,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontWeight:800,color:tc}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:sc,marginTop:3}}>{sub}</div>}
  </div>;
}

const newRow=()=>({id:mkid(),date:"",desc:"",cat:"",income:"",expense:"",note:""});
const newMonth=()=>({target:"",openBalance:"",notes:"",rows:Array.from({length:15},newRow)});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeDefault=():any=>({
  info:{biz:"",trade:"",year:"2026",country:"Nigeria"},
  months:MONTHS.map(()=>newMonth()),
  forecast:MONTHS.map(()=>({svc:"",product:"",other:"",fixed:"",variable:"",marketing:"",loan:"",otherExp:""}))
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthView({mIdx,d,update,sym}:{mIdx:number,d:any,update:any,sym:string}){
  const mo=d.months[mIdx];
  const year=d.info.year||"2026";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upMo=(f:string,v:string)=>update((prev:any)=>({...prev,months:prev.months.map((m:any,i:number)=>i===mIdx?{...m,[f]:v}:m)}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upRow=(id:string,f:string,v:string)=>update((prev:any)=>({...prev,months:prev.months.map((m:any,i:number)=>i!==mIdx?m:{...m,rows:m.rows.map((r:any)=>r.id===id?{...r,[f]:v}:r)})}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addRow=()=>update((prev:any)=>({...prev,months:prev.months.map((m:any,i:number)=>i===mIdx?{...m,rows:[...m.rows,newRow()]}:m)}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delRow=(id:string)=>update((prev:any)=>({...prev,months:prev.months.map((m:any,i:number)=>i===mIdx?{...m,rows:m.rows.filter((r:any)=>r.id!==id)}:m)}));
  const totalIncome=mo.rows.reduce((a:number,r:any)=>a+num(r.income),0);
  const totalExpense=mo.rows.reduce((a:number,r:any)=>a+num(r.expense),0);
  const profit=totalIncome-totalExpense;
  const margin=totalIncome>0?profit/totalIncome:null;
  const tgt=num(mo.target);
  const openBal=num(mo.openBalance);
  const closingBal=openBal+profit;
  let running=openBal;
  const rowsWithBal=mo.rows.map((r:any)=>{running+=num(r.income)-num(r.expense);return{...r,bal:running};});
  const byIncome=INCOME_CATS.map(c=>({cat:c,total:mo.rows.filter((r:any)=>r.cat===c).reduce((a:number,r:any)=>a+num(r.income),0)})).filter(c=>c.total>0);
  const byExpense=EXPENSE_CATS.map(c=>({cat:c,total:mo.rows.filter((r:any)=>r.cat===c).reduce((a:number,r:any)=>a+num(r.expense),0)})).filter(c=>c.total>0);
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
      <KPI accent label="Total Income" val={`${sym}${fmt(totalIncome)}`} sub={tgt>0?`${fmtPct(tgt>0?totalIncome/tgt:0)} of ${sym}${fmt(tgt)} target`:undefined}/>
      <KPI label="Total Expenses" val={`${sym}${fmt(totalExpense)}`}/>
      <KPI accent={profit>=0} warn={profit<0} label="Gross Profit" val={profit>=0?`${sym}${fmt(profit)}`:`(${sym}${fmt(Math.abs(profit))})`}/>
      <KPI green={margin!==null&&margin>=0.2} warn={margin!==null&&margin<0} label="Profit Margin" val={fmtPct(margin)}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
      <div style={{...card,marginBottom:0,padding:"14px 16px"}}>
        <label style={{fontSize:12,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>Income Target, {MONTHS[mIdx]}</label>
        <Inp val={mo.target} set={v=>upMo("target",v)} type="number" ph="Set your income goal" right/>
        {tgt>0&&<div style={{marginTop:8}}>
          <div style={{height:6,background:LGRAY,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min(totalIncome/tgt*100,100)}%`,background:totalIncome>=tgt?"#27ae60":B,borderRadius:3}}/>
          </div>
          <div style={{marginTop:5,fontSize:12,color:totalIncome>=tgt?"#27ae60":MID,fontWeight:600}}>{totalIncome>=tgt?"✓ Target reached!":`${sym}${fmt(tgt-totalIncome)} still to go`}</div>
        </div>}
      </div>
      <div style={{...card,marginBottom:0,padding:"14px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:12,fontWeight:700,color:DARK,display:"block",marginBottom:6}}>Opening Balance</label><Inp val={mo.openBalance} set={v=>upMo("openBalance",v)} type="number" ph="Cash at start" right/></div>
          <div><div style={{fontSize:12,fontWeight:700,color:DARK,marginBottom:6}}>Closing Balance</div><div style={{padding:"8px 10px",background:closingBal<0?"#fdecea":LITE,borderRadius:7,fontSize:15,fontWeight:800,color:closingBal<0?"#c0392b":DARK,textAlign:"right"}}>{sym}{fmt(closingBal)}</div></div>
        </div>
      </div>
    </div>
    <div style={{...card,padding:0,overflow:"hidden",marginBottom:14}}>
      <div style={{background:DARK,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:W,fontWeight:700,fontSize:14}}>{MONTHS[mIdx]} Transactions</span>
        <span style={{color:"rgba(255,255,255,.45)",fontSize:12}}>One row per payment in or out</span>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:660}}>
          <thead><tr>
            <th style={{...TH,width:"11%"}}>Date</th><th style={{...TH,width:"22%"}}>Description</th><th style={{...TH,width:"16%"}}>Category</th>
            <th style={{...TH,textAlign:"right" as const,width:"11%"}}>Income ({sym})</th><th style={{...TH,textAlign:"right" as const,width:"11%"}}>Expense ({sym})</th>
            <th style={{...TH,textAlign:"right" as const,width:"11%"}}>Balance</th><th style={{...TH,width:"14%"}}>Note</th><th style={{...TH,width:"4%"}}></th>
          </tr></thead>
          <tbody>{rowsWithBal.map((r:any,i:number)=>{
            const hasData=num(r.income)||num(r.expense);
            return <tr key={r.id} style={{background:i%2===0?W:LGRAY}}>
              <td style={TD(i%2===1)}><input type="date" value={r.date||""} onChange={e=>upRow(r.id,"date",e.target.value)} style={{padding:"5px 6px",border:`1.5px solid ${MGRAY}`,borderRadius:6,fontSize:12,width:"100%",outline:"none",background:"transparent",cursor:"pointer"}}/></td>
              <td style={TD(i%2===1)}><Inp val={r.desc} set={v=>upRow(r.id,"desc",v)} ph="What was this for?" sm/></td>
              <td style={TD(i%2===1)}><Sel val={r.cat} set={v=>upRow(r.id,"cat",v)} opts={ALL_CATS} sm/></td>
              <td style={TD(i%2===1)}><Inp val={r.income} set={v=>upRow(r.id,"income",v)} type="number" right sm/></td>
              <td style={TD(i%2===1)}><Inp val={r.expense} set={v=>upRow(r.id,"expense",v)} type="number" right sm/></td>
              <td style={{...TD(i%2===1),textAlign:"right",fontWeight:700,color:!hasData?"#ccc":r.bal>=0?DARK:"#c0392b"}}>{hasData?`${sym}${fmt(r.bal)}`:" "}</td>
              <td style={TD(i%2===1)}><Inp val={r.note} set={v=>upRow(r.id,"note",v)} ph="Optional" sm/></td>
              <td style={TD(i%2===1)}><button onClick={()=>delRow(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#e74c3c",fontSize:17,lineHeight:1,padding:"0 2px"}}>×</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div style={{padding:"9px 16px",borderTop:`1px solid ${LGRAY}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={addRow} style={{background:"transparent",border:`1.5px dashed ${MID}`,borderRadius:8,color:MID,fontSize:13,fontWeight:600,cursor:"pointer",padding:"6px 14px"}}>+ Add Transaction</button>
        <span style={{fontSize:12,color:MID}}>{mo.rows.filter((r:any)=>r.desc||r.income||r.expense).length} entries</span>
      </div>
    </div>
    <div style={{...card,border:`2px solid ${B}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:DARK}}>{MONTHS[mIdx]} {year}, Monthly Summary</div>
          <div style={{fontSize:12,color:MID,marginTop:2}}>{d.info.biz||"Your Business"}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {([["Total Income",`${sym}${fmt(totalIncome)}`,LITE],["Total Expenses",`${sym}${fmt(totalExpense)}`,LGRAY],["Net Profit",profit>=0?`${sym}${fmt(profit)}`:`(${sym}${fmt(Math.abs(profit))})`,profit>=0?"#e8f5e9":"#fdecea"],["Profit Margin",fmtPct(margin),LITE],["Closing Balance",`${sym}${fmt(closingBal)}`,closingBal<0?"#fdecea":LITE]] as [string,string,string][]).map(([l,v,bg])=>(
          <div key={l} style={{background:bg,borderRadius:8,padding:"11px 13px"}}>
            <div style={{fontSize:10,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:4}}>{l}</div>
            <div style={{fontSize:17,fontWeight:800,color:DARK}}>{v}</div>
          </div>
        ))}
      </div>
      {(byIncome.length>0||byExpense.length>0)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:DARK,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Income Breakdown</div>
          {byIncome.length===0?<div style={{fontSize:12,color:"#aaa"}}>No income recorded</div>:byIncome.map((c,i)=>(
            <div key={c.cat} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:i%2===0?LITE:W,borderRadius:5,marginBottom:3}}>
              <span style={{fontSize:13,color:DARK}}>{c.cat}</span>
              <div><span style={{fontSize:13,fontWeight:700,color:"#27ae60"}}>{sym}{fmt(c.total)}</span><span style={{fontSize:11,color:MID,marginLeft:6}}>{totalIncome>0?Math.round(c.total/totalIncome*100):0}%</span></div>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:DARK,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Expense Breakdown</div>
          {byExpense.length===0?<div style={{fontSize:12,color:"#aaa"}}>No expenses recorded</div>:byExpense.map((c,i)=>(
            <div key={c.cat} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:i%2===0?LGRAY:W,borderRadius:5,marginBottom:3}}>
              <span style={{fontSize:13,color:DARK}}>{c.cat}</span>
              <div><span style={{fontSize:13,fontWeight:700,color:"#c0392b"}}>{sym}{fmt(c.total)}</span><span style={{fontSize:11,color:MID,marginLeft:6}}>{totalExpense>0?Math.round(c.total/totalExpense*100):0}%</span></div>
            </div>
          ))}
        </div>
      </div>}
      <div>
        <label style={{fontSize:12,fontWeight:700,color:DARK,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>Notes for {MONTHS[mIdx]}</label>
        <textarea value={mo.notes||""} onChange={e=>upMo("notes",e.target.value)} placeholder="What went well? What will you do differently next month?" rows={3}
          style={{width:"100%",padding:"10px 13px",border:`1.5px solid ${MGRAY}`,borderRadius:8,fontSize:13,lineHeight:1.6,outline:"none",resize:"vertical",fontFamily:"inherit",color:DARK,boxSizing:"border-box"}}/>
      </div>
    </div>
  </div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnnualSummary({d,sym}:{d:any,sym:string}){
  const stats=d.months.map((mo:any,i:number)=>({
    name:MONTHS[i],short:SHORT[i],
    income:mo.rows.reduce((a:number,r:any)=>a+num(r.income),0),
    expense:mo.rows.reduce((a:number,r:any)=>a+num(r.expense),0),
    target:num(mo.target),
  })).map((s:any)=>({...s,profit:s.income-s.expense,margin:s.income>0?(s.income-s.expense)/s.income:null}));
  const totI=stats.reduce((a:number,s:any)=>a+s.income,0),totE=stats.reduce((a:number,s:any)=>a+s.expense,0),totP=totI-totE;
  const annM=totI>0?totP/totI:null;
  const best=stats.reduce((a:any,s:any)=>s.profit>a.profit?s:a,stats[0]);
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:16}}>
      <KPI accent label="Annual Income" val={`${sym}${fmt(totI)}`}/>
      <KPI label="Annual Expenses" val={`${sym}${fmt(totE)}`}/>
      <KPI accent={totP>=0} warn={totP<0} label="Annual Profit" val={totP>=0?`${sym}${fmt(totP)}`:`(${sym}${fmt(Math.abs(totP))})`}/>
      <KPI green={annM!==null&&annM>=0.2} label="Annual Margin" val={fmtPct(annM)}/>
    </div>
    <div style={{...card,padding:0,overflow:"hidden"}}>
      <div style={{background:DARK,padding:"11px 16px",color:W,fontWeight:700,fontSize:14}}>Month-by-Month</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:580}}>
          <thead><tr>{["Month","Income","Expenses","Profit / (Loss)","Margin","vs Prior Month","Target"].map((h,i)=><th key={i} style={{...TH,textAlign:(i===0?"left":"right") as "left"|"right"}}>{h}</th>)}</tr></thead>
          <tbody>{stats.map((s:any,i:number)=>{
            const prev=i>0?stats[i-1]:null;
            const delta=prev?s.profit-prev.profit:null;
            const hasData=s.income>0||s.expense>0;
            return <tr key={s.name} style={{background:i%2===0?W:LGRAY}}>
              <td style={{...TD(i%2===1),fontWeight:600}}>{s.name}</td>
              <td style={{...TD(i%2===1),textAlign:"right"}}>{hasData?`${sym}${fmt(s.income)}`:" "}</td>
              <td style={{...TD(i%2===1),textAlign:"right"}}>{hasData?`${sym}${fmt(s.expense)}`:" "}</td>
              <td style={{...TD(i%2===1),textAlign:"right",fontWeight:700,color:!hasData?"#ccc":s.profit>=0?"#27ae60":"#c0392b"}}>{hasData?(s.profit>=0?`${sym}${fmt(s.profit)}`:`(${sym}${fmt(Math.abs(s.profit))})`):""}</td>
              <td style={{...TD(i%2===1),textAlign:"right",color:!hasData?"#ccc":s.margin!==null&&s.margin>=0.2?"#27ae60":"#c0392b"}}>{hasData&&s.margin!==null?fmtPct(s.margin):" "}</td>
              <td style={{...TD(i%2===1),textAlign:"right",color:delta===null||!hasData?"#ccc":delta>=0?"#27ae60":"#c0392b",fontWeight:600}}>{delta!==null&&hasData?(delta>=0?`+${sym}${fmt(delta)}`:`-${sym}${fmt(Math.abs(delta))}`):" "}</td>
              <td style={{...TD(i%2===1),textAlign:"right"}}>{s.target>0?(s.income>=s.target?"✓":"✗"):" "}</td>
            </tr>;
          })}</tbody>
          <tfoot><tr style={{background:DARK}}>
            <td style={{padding:"9px 10px",color:W,fontWeight:700}}>ANNUAL TOTAL</td>
            <td style={{padding:"9px 10px",color:W,fontWeight:700,textAlign:"right"}}>{sym}{fmt(totI)}</td>
            <td style={{padding:"9px 10px",color:W,fontWeight:700,textAlign:"right"}}>{sym}{fmt(totE)}</td>
            <td style={{padding:"9px 10px",color:W,fontWeight:700,textAlign:"right"}}>{totP>=0?`${sym}${fmt(totP)}`:`(${sym}${fmt(Math.abs(totP))})`}</td>
            <td style={{padding:"9px 10px",color:W,fontWeight:700,textAlign:"right"}}>{fmtPct(annM)}</td>
            <td colSpan={2} style={{padding:"9px 10px",color:"rgba(255,255,255,.4)",fontSize:12,textAlign:"right"}}>{stats.filter((s:any)=>s.income>0||s.expense>0).length} active months</td>
          </tr></tfoot>
        </table>
      </div>
    </div>
    {totI>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginTop:4}}>
      {([["Best Month",best.name,`${sym}${fmt(best.profit)} profit`],["Monthly Avg Income",`${sym}${fmt(Math.round(totI/12))}`,"per month on average"],["Expense Ratio",fmtPct(totI>0?totE/totI:null),"of income spent on costs"]] as [string,string,string][]).map(([l,v,sub])=>(
        <div key={l} style={{background:W,borderRadius:10,border:`1px solid ${MGRAY}`,padding:"14px 16px"}}>
          <div style={{fontSize:10,fontWeight:700,color:MID,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>{l}</div>
          <div style={{fontSize:20,fontWeight:800,color:DARK}}>{v}</div>
          <div style={{fontSize:12,color:MID,marginTop:3}}>{sub}</div>
        </div>
      ))}
    </div>}
  </div>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Forecast({d,update,sym}:{d:any,update:any,sym:string}){
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upF=(mi:number,f:string,v:string)=>update((prev:any)=>({...prev,forecast:prev.forecast.map((m:any,i:number)=>i===mi?{...m,[f]:v}:m)}));
  const rows=d.forecast.map((f:any)=>({inc:num(f.svc)+num(f.product)+num(f.other),exp:num(f.fixed)+num(f.variable)+num(f.marketing)+num(f.loan)+num(f.otherExp)}));
  let running=num(d.months[0].openBalance)||0;
  const withBal=rows.map((r:any)=>{const open=running;running=open+r.inc-r.exp;return{...r,open,close:running,net:r.inc-r.exp};});
  const annI=rows.reduce((a:number,r:any)=>a+r.inc,0),annE=rows.reduce((a:number,r:any)=>a+r.exp,0);
  const negCount=withBal.filter((r:any)=>r.close<0).length;
  const THF:React.CSSProperties={background:B,color:W,padding:"7px 8px",fontWeight:700,fontSize:11,textAlign:"right",minWidth:78,whiteSpace:"nowrap"};
  const THL:React.CSSProperties={background:DARK,color:W,padding:"7px 10px",fontWeight:700,fontSize:11,textAlign:"left",width:"17%"};
  return <div>
    <div style={{...card,background:LITE,border:`1.5px solid ${B}`,padding:"14px 18px"}}>
      <p style={{margin:0,fontSize:13,color:DARK,lineHeight:1.7}}><b>Cashflow Forecast</b>: enter what you expect to earn and spend each month. Negative closing balance means you need to plan now.</p>
    </div>
    {negCount>0&&<div style={{...card,background:"#fdecea",border:"1.5px solid #f5c6cb",padding:"12px 16px"}}><p style={{margin:0,fontSize:13,fontWeight:700,color:"#c0392b"}}>⚠ {negCount} month{negCount>1?"s":""} forecast to go negative. Plan how to cover these shortfalls before they arrive.</p></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:14}}>
      <KPI accent label="Forecast Annual Income" val={`${sym}${fmt(annI)}`}/>
      <KPI label="Forecast Annual Expenses" val={`${sym}${fmt(annE)}`}/>
      <KPI accent={annI>=annE} warn={annI<annE} label="Forecast Net" val={`${sym}${fmt(annI-annE)}`}/>
    </div>
    {([["Income Forecast",[["Service Income","svc"],["Product Sales","product"],["Other Income","other"]],"inc","#2e7d32"],["Expense Forecast",[["Fixed Costs","fixed"],["Variable / Materials","variable"],["Marketing","marketing"],["Loan Repayments","loan"],["Other Expenses","otherExp"]],"exp","#c0392b"]] as [string,[string,string][],string,string][]).map(([title,fields,totKey,totCol])=>(
      <div key={title} style={{...card,padding:0,overflow:"hidden"}}>
        <div style={{background:DARK,padding:"10px 14px",color:W,fontWeight:700,fontSize:13}}>{title}</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><th style={THL}></th>{MONTHS.map(m=><th key={m} style={THF}>{m.slice(0,3)}</th>)}</tr></thead>
            <tbody>
              {fields.map(([l,f],ri)=>(
                <tr key={f} style={{background:ri%2===0?W:LGRAY}}>
                  <td style={{padding:"5px 10px",fontSize:13,fontWeight:600,color:DARK}}>{l}</td>
                  {d.forecast.map((_:any,mi:number)=>(
                    <td key={mi} style={{padding:"3px 4px"}}><input type="number" value={d.forecast[mi][f]||""} onChange={e=>upF(mi,f,e.target.value)} style={{padding:"4px 6px",border:`1.5px solid ${MGRAY}`,borderRadius:6,fontSize:12,width:"100%",outline:"none",textAlign:"right"}}/></td>
                  ))}
                </tr>
              ))}
              <tr style={{background:LITE}}>
                <td style={{padding:"7px 10px",fontSize:13,fontWeight:700,color:DARK}}>TOTAL</td>
                {withBal.map((r:any,i:number)=><td key={i} style={{padding:"7px 8px",textAlign:"right",fontSize:13,fontWeight:700,color:totCol}}>{sym}{fmt(r[totKey])}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </div>;
}

// ── Tracker Tool ───────────────────────────────────────────────────────────
function TrackerTool({code,onSignOut}:{code:string,onSignOut:()=>void}){
  const [view,setView]=useState("month");
  const [mIdx,setMIdx]=useState(new Date().getMonth());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [d,sd]=useState<any>(null);
  const [saved,setSaved]=useState(false);
  const [saveTimer,setSaveTimer]=useState<ReturnType<typeof setTimeout>|null>(null);
  const sym=d?getSym(d.info.country||"Nigeria"):"₦";

  useEffect(()=>{
    async function load(){
      try{const res=await fetch(`/api/tools-data?code=${encodeURIComponent(code)}&tool=tracker`);if(res.ok){const j=await res.json();if(j.data){sd(j.data);return;}}}catch{}
      try{const s=localStorage.getItem("pds-tracker-data");if(s){sd(JSON.parse(s));return;}}catch{}
      sd(makeDefault());
    }
    load();
  },[code]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save=useCallback((data:any)=>{
    try{localStorage.setItem("pds-tracker-data",JSON.stringify(data));}catch{}
    if(saveTimer)clearTimeout(saveTimer);
    const t=setTimeout(async()=>{
      try{await fetch("/api/tools-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,tool:"tracker",data})});}catch{}
    },1500);
    setSaveTimer(t);
    setSaved(true);setTimeout(()=>setSaved(false),1800);
  },[code,saveTimer]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update=(fn:(prev:any)=>any)=>{sd((prev:any)=>{const next=fn(prev);save(next);return next;});};

  if(!d)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:MID,fontSize:14}}>Loading your data...</div>;

  const curMonth=d.months[mIdx];
  const curProfit=curMonth.rows.reduce((a:number,r:any)=>a+num(r.income)-num(r.expense),0);
  const hasData=curMonth.rows.some((r:any)=>r.income||r.expense);

  return <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
    <div style={{background:DARK,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:1.2,textTransform:"uppercase"}}>Prowess Digital Solutions · 2026</div>
        <div style={{fontSize:18,fontWeight:800,color:W,marginTop:2}}>Profit & Cashflow Tracker</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Prowess Digital Solutions</div>
        <div style={{fontSize:11,fontWeight:600,color:saved?"#81c784":"rgba(255,255,255,.4)",marginTop:2}}>{saved?"✓ Saved":"Auto-saving..."}</div>
      </div>
    </div>
    <div style={{background:B,padding:"9px 22px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
      {([["biz","Business Name",170],["trade","Trade / Service",170],["year","Year",90]] as [string,string,number][]).map(([f,p,w])=>(
        <input key={f} value={d.info[f]||""} placeholder={p} onChange={e=>update(x=>({...x,info:{...x.info,[f]:e.target.value}}))}
          style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,padding:"6px 11px",color:W,fontSize:13,fontWeight:600,outline:"none",width:w}}/>
      ))}
      <select value={d.info.country||"Nigeria"} onChange={e=>update(x=>({...x,info:{...x.info,country:e.target.value}}))}
        style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,padding:"6px 9px",color:W,fontSize:13,fontWeight:600,outline:"none",width:155,cursor:"pointer"}}>
        {COUNTRIES.map(([n])=><option key={n} value={n} style={{color:"#333"}}>{n}</option>)}
      </select>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <a href="/tools" style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,textDecoration:"none"}}>← Tools</a>
        <button onClick={onSignOut} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
      </div>
    </div>
    <div style={{background:W,borderBottom:`2px solid ${MGRAY}`,display:"flex",padding:"0 22px",overflowX:"auto",gap:2,alignItems:"stretch"}}>
      {([["month","Monthly Tracker"],["annual","Annual Summary"],["forecast","Cashflow Forecast"]] as [string,string][]).map(([v,l])=>(
        <button key={v} onClick={()=>setView(v)} style={{padding:"12px 17px",background:"transparent",border:"none",cursor:"pointer",fontSize:14,fontWeight:700,whiteSpace:"nowrap",color:view===v?B:"#999",borderBottom:view===v?`3px solid ${B}`:"3px solid transparent",marginBottom:-2}}>{l}</button>
      ))}
      {view==="month"&&<div style={{display:"flex",marginLeft:10,alignItems:"center",gap:2,overflowX:"auto",borderLeft:`1px solid ${MGRAY}`,paddingLeft:10}}>
        {SHORT.map((s,i)=>{
          const hasDat=d.months[i].rows.some((r:any)=>r.income||r.expense);
          return <button key={i} onClick={()=>setMIdx(i)} style={{padding:"6px 10px",background:mIdx===i?B:"transparent",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,borderRadius:6,color:mIdx===i?W:hasDat?DARK:"#bbb",whiteSpace:"nowrap"}}>{s}</button>;
        })}
      </div>}
    </div>
    <div style={{padding:"18px 22px",maxWidth:1200,margin:"0 auto"}}>
      {view==="month"&&<div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:14}}>
          <h2 style={{margin:0,color:DARK,fontSize:19,fontWeight:800}}>{MONTHS[mIdx]} {d.info.year||"2026"}</h2>
          {hasData&&<span style={{fontSize:14,fontWeight:700,color:curProfit>=0?"#27ae60":"#c0392b"}}>{curProfit>=0?`${sym}${fmt(curProfit)} profit`:`${sym}${fmt(Math.abs(curProfit))} loss`}</span>}
        </div>
        <MonthView mIdx={mIdx} d={d} update={update} sym={sym}/>
      </div>}
      {view==="annual"&&<AnnualSummary d={d} sym={sym}/>}
      {view==="forecast"&&<Forecast d={d} update={update} sym={sym}/>}
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

export default function TrackerPage(){
  const [code,setCode]=useState("");
  const [grantedCode,setGrantedCode]=useState<string|null>(null);
  const [status,setStatus]=useState<"idle"|"checking"|"denied">("idle");
  const [reason,setReason]=useState("");

  useEffect(()=>{
    const raw=localStorage.getItem("pds-access-tracker");
    if(!raw)return;
    try{const saved=JSON.parse(raw) as {code:string};silentVerify(saved.code);}
    catch{localStorage.removeItem("pds-access-tracker");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function silentVerify(savedCode:string){
    try{
      const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:savedCode})});
      const data=await res.json();
      if(data.valid){setGrantedCode(savedCode);localStorage.setItem("pds-access-tracker",JSON.stringify({code:savedCode}));}
      else{localStorage.removeItem("pds-access-tracker");}
    }catch{localStorage.removeItem("pds-access-tracker");}
  }

  async function verify(){
    setStatus("checking");
    try{
      const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim()})});
      const data=await res.json();
      if(data.valid){const c=code.trim().toUpperCase();setGrantedCode(c);localStorage.setItem("pds-access-tracker",JSON.stringify({code:c}));}
      else{setReason(data.reason??"invalid");setStatus("denied");localStorage.removeItem("pds-access-tracker");}
    }catch{setReason("invalid");setStatus("denied");}
  }

  function signOut(){localStorage.removeItem("pds-access-tracker");setGrantedCode(null);setCode("");setStatus("idle");}



  if(grantedCode) return <TrackerTool code={grantedCode} onSignOut={signOut}/>;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .g-root{min-height:100vh;background:#08141a;display:flex;flex-direction:column;align-items:stretch;font-family:'DM Sans',sans-serif;position:relative;overflow:hidden;color:#fff}
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
        .g-pill:nth-child(1){animation-delay:.15s}
        .g-pill:nth-child(2){animation-delay:.25s}
        .g-pill:nth-child(3){animation-delay:.35s}
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
        @media(max-width:800px){.g-left{display:none}.g-body{padding:16px 16px 36px}}
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
              <h1 className="g-headline">Your money deserves<br/><span className="hi">a clear picture.</span></h1>
              <p className="g-body-txt">Running a business without tracking your cashflow is like driving without looking at the road. This tracker gives you a full view of every naira, every month, every year.</p>
              <div className="g-pills">
                {[
                  {icon:"📅",title:"Monthly Tracker",sub:"Every transaction, every category, every day"},
                  {icon:"📊",title:"Annual Overview",sub:"See how your year performed at a glance"},
                  {icon:"🔮",title:"Cashflow Forecast",sub:"Project ahead so you never get caught short"},
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
                <div className="g-card-title">Profit Tracker</div>
                <div className="g-card-sub">Enter your Prowess Digital Solutions access code to unlock the full tracker.</div>

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
                  {status==="checking"?"Verifying your code...":"Unlock Tracker →"}
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

