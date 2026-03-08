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
        {(["Total Income",`${sym}${fmt(totalIncome)}`,LITE],["Total Expenses",`${sym}${fmt(totalExpense)}`,LGRAY],["Net Profit",profit>=0?`${sym}${fmt(profit)}`:`(${sym}${fmt(Math.abs(profit))})`,profit>=0?"#e8f5e9":"#fdecea"],["Profit Margin",fmtPct(margin),LITE],["Closing Balance",`${sym}${fmt(closingBal)}`,closingBal<0?"#fdecea":LITE]) as [string,string,string][]).map(([l,v,bg])=>(
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
      {(["Best Month",best.name,`${sym}${fmt(best.profit)} profit`],["Monthly Avg Income",`${sym}${fmt(Math.round(totI/12))}`,"per month on average"],["Expense Ratio",fmtPct(totI>0?totE/totI:null),"of income spent on costs"]) as [string,string,string][]).map(([l,v,sub])=>(
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
      {(["biz","Business Name",170],["trade","Trade / Service",170],["year","Year",90]) as [string,string,number][]).map(([f,p,w])=>(
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
      {(["month","Monthly Tracker"],["annual","Annual Summary"],["forecast","Cashflow Forecast"]) as [string,string][]).map(([v,l])=>(
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
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${DARK},#0f2627)`,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{maxWidth:420,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:64,height:64,background:"rgba(255,255,255,.1)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>📊</div>
          <div style={{fontSize:11,fontWeight:700,color:MID,letterSpacing:1.6,textTransform:"uppercase",marginBottom:6}}>Prowess Digital Solutions</div>
          <div style={{fontSize:24,fontWeight:900,color:W,marginBottom:4}}>Profit Tracker</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.5)"}}>Enter your access code to continue</div>
        </div>
        <div style={{background:"rgba(255,255,255,.06)",borderRadius:16,padding:"26px 28px",border:"1px solid rgba(255,255,255,.1)"}}>
          <label style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.7)",display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Your Access Code</label>
          <input value={code} placeholder="PDS-XXXX-XXXX" onChange={e=>{setCode(e.target.value.toUpperCase());setStatus("idle");}}
            onKeyDown={e=>e.key==="Enter"&&verify()} disabled={status==="checking"} autoComplete="off"
            style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,.08)",border:`2px solid ${status==="denied"?"#ff8a80":"rgba(255,255,255,.2)"}`,borderRadius:10,color:W,fontSize:16,fontWeight:700,outline:"none",textAlign:"center",letterSpacing:2,boxSizing:"border-box"}}/>
          {status==="denied"&&<div style={{color:"#ff8a80",fontSize:12,marginTop:8,fontWeight:600,textAlign:"center"}}>{REASON_MSG[reason]??REASON_MSG.invalid}</div>}
          <button onClick={verify} disabled={status==="checking"||!code.trim()}
            style={{marginTop:14,width:"100%",padding:"13px",background:code.trim()?B:"rgba(255,255,255,.1)",color:W,border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:code.trim()?"pointer":"default"}}>
            {status==="checking"?"Checking...":"Access Tool →"}
          </button>
          <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,.3)",margin:"12px 0 0"}}>Code provided by Prowess Digital Solutions on registration.</p>
        </div>
      </div>
    </div>
  );
}
