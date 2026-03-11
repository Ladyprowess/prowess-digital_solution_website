"use client";
import { useState, useEffect, useCallback } from "react";

const B="#507c80",DARK="#3a5c60",MID="#6a9ea3",LITE="#e8f4f5",LGRAY="#f2f5f5",MGRAY="#c8d8da",W="#fff";
const mkid=()=>Math.random().toString(36).slice(2,9);
const num=(v:unknown)=>{const x=parseFloat(String(v||"").replace(/,/g,""));return isNaN(x)?0:x;};
const fmt=(v:unknown)=>Math.round(num(v)).toLocaleString("en")||"0";

const PRODUCT_CATS=["Raw Materials","Finished Products","Packaging","Beverages","Food Items","Clothing","Electronics","Household Goods","Beauty & Skincare","Stationery","Tools & Equipment","Spare Parts","Other"];
const SERVICE_CATS=["Consultation","Training","Design","Repair & Maintenance","Delivery","Cleaning","Security","Legal","Accounting","Other"];
const UNITS=["pieces","kg","litres","metres","boxes","bags","bottles","cans","packs","sets","pairs","sheets","bundles","cartons"];

interface ProductItem{id:string;name:string;cat:string;qty:string;reorderLevel:string;unit:string;costPrice:string;sellPrice:string;sku:string;note:string;}
interface ServiceItem{id:string;name:string;cat:string;price:string;duration:string;slotsPerWeek:string;available:boolean;note:string;}

const blankProduct=():ProductItem=>({id:mkid(),name:"",cat:"Other",qty:"",reorderLevel:"",unit:"pieces",costPrice:"",sellPrice:"",sku:"",note:""});
const blankService=():ServiceItem=>({id:mkid(),name:"",cat:"Other",price:"",duration:"",slotsPerWeek:"",available:true,note:""});

const stockStatus=(item:ProductItem)=>{
  const q=num(item.qty),r=num(item.reorderLevel);
  if(q<=0)return"out";
  if(r>0&&q<=r*0.5)return"critical";
  if(r>0&&q<=r)return"low";
  return"ok";
};
const STATUS_META:{[k:string]:{label:string,bg:string,c:string,b:string,bar:string}}={
  ok:{label:"In Stock",bg:"#e8f5e9",c:"#2e7d32",b:"#a5d6a7",bar:"#27ae60"},
  low:{label:"Low Stock",bg:"#fff7ed",c:"#c2410c",b:"#fed7aa",bar:"#f97316"},
  critical:{label:"Critical",bg:"#fdecea",c:"#c0392b",b:"#f5c6cb",bar:"#e74c3c"},
  out:{label:"Out of Stock",bg:"#fdecea",c:"#c0392b",b:"#f5c6cb",bar:"#c0392b"},
};

const card:React.CSSProperties={background:W,borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(58,92,96,.10)",border:`1.5px solid ${MGRAY}`,marginBottom:14};

function FI({label,val,set,ph="",type="text",right=false}:{label?:string,val:unknown,set:(v:string)=>void,ph?:string,type?:string,right?:boolean}){
  const [f,sf]=useState(false);
  return <div style={{marginBottom:10}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:.4}}>{label}</label>}
    <input type={type} value={String(val||"")} placeholder={ph} onChange={e=>set(e.target.value)} onFocus={()=>sf(true)} onBlur={()=>sf(false)}
      style={{padding:"8px 11px",border:`1.5px solid ${f?B:MGRAY}`,borderRadius:8,fontSize:13,width:"100%",outline:"none",boxSizing:"border-box",textAlign:right?"right":"left",background:W,color:DARK}}/>
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
function KPI({label,val,sub,accent,warn,green}:{label:string,val:string,sub?:string,accent?:boolean,warn?:boolean,green?:boolean}){
  const bg=warn?"#fdecea":green?"#e8f5e9":accent?B:LITE,tc=warn?"#c0392b":green?"#2e7d32":accent?W:DARK,sc=warn?"#c0392b":green?"#388e3c":accent?"rgba(255,255,255,.7)":MID;
  return <div style={{background:bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${warn?"#f5c6cb":green?"#a5d6a7":accent?DARK:MGRAY}`}}>
    <div style={{fontSize:10,fontWeight:700,color:sc,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontWeight:800,color:tc}}>{val}</div>
    {sub&&<div style={{fontSize:11,color:sc,marginTop:3}}>{sub}</div>}
  </div>;
}

// ── Product Form ─────────────────────────────────────────────────────────
function ProductForm({item,onSave,onCancel}:{item:ProductItem,onSave:(i:ProductItem)=>void,onCancel:()=>void}){
  const [v,sv]=useState(item);
  const u=(f:keyof ProductItem,val:string)=>sv(p=>({...p,[f]:val}));
  return <div style={{...card,border:`2px solid ${B}`}}>
    <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:14}}>{item.name?"Edit Item":"Add Product"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FI label="Product Name *" val={v.name} set={val=>u("name",val)} ph="e.g. Rice Flour 1kg"/>
      <FSel label="Category" val={v.cat} set={val=>u("cat",val)} opts={PRODUCT_CATS}/>
      <FI label="Current Quantity" val={v.qty} set={val=>u("qty",val)} type="number" ph="How many in stock?" right/>
      <FSel label="Unit" val={v.unit} set={val=>u("unit",val)} opts={UNITS}/>
      <FI label="Reorder Level" val={v.reorderLevel} set={val=>u("reorderLevel",val)} type="number" ph="Alert when below this" right/>
      <FI label="SKU / Product Code" val={v.sku} set={val=>u("sku",val)} ph="Optional code"/>
      <FI label="Cost Price" val={v.costPrice} set={val=>u("costPrice",val)} type="number" ph="What you paid" right/>
      <FI label="Selling Price" val={v.sellPrice} set={val=>u("sellPrice",val)} type="number" ph="What you charge" right/>
    </div>
    <FI label="Notes (optional)" val={v.note} set={val=>u("note",val)} ph="Any notes about this product"/>
    <div style={{display:"flex",gap:8,marginTop:4}}>
      <button onClick={()=>onSave(v)} style={{padding:"9px 20px",background:B,border:"none",borderRadius:8,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>Save</button>
      <button onClick={onCancel} style={{padding:"9px 16px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,color:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

// ── Service Form ──────────────────────────────────────────────────────────
function ServiceForm({item,onSave,onCancel}:{item:ServiceItem,onSave:(i:ServiceItem)=>void,onCancel:()=>void}){
  const [v,sv]=useState(item);
  const u=(f:keyof ServiceItem,val:string|boolean)=>sv(p=>({...p,[f]:val}));
  return <div style={{...card,border:`2px solid ${B}`}}>
    <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:14}}>{item.name?"Edit Service":"Add Service"}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FI label="Service Name *" val={v.name} set={val=>u("name",val)} ph="e.g. Full Hair Braiding"/>
      <FSel label="Category" val={v.cat} set={val=>u("cat",val)} opts={SERVICE_CATS}/>
      <FI label="Price" val={v.price} set={val=>u("price",val)} type="number" ph="How much do you charge?" right/>
      <FI label="Duration" val={v.duration} set={val=>u("duration",val)} ph="e.g. 2 hours"/>
      <FI label="Slots per Week" val={v.slotsPerWeek} set={val=>u("slotsPerWeek",val)} type="number" ph="How many per week?" right/>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:700,color:B,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:.4}}>Availability</label>
        <div style={{display:"flex",gap:8}}>
          {[true,false].map(a=><button key={String(a)} onClick={()=>u("available",a)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${v.available===a?B:MGRAY}`,background:v.available===a?B:W,color:v.available===a?W:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>{a?"Available":"Unavailable"}</button>)}
        </div>
      </div>
    </div>
    <FI label="Notes (optional)" val={v.note} set={val=>u("note",val)} ph="Any notes about this service"/>
    <div style={{display:"flex",gap:8,marginTop:4}}>
      <button onClick={()=>onSave(v)} style={{padding:"9px 20px",background:B,border:"none",borderRadius:8,color:W,fontSize:13,fontWeight:700,cursor:"pointer"}}>Save</button>
      <button onClick={onCancel} style={{padding:"9px 16px",background:W,border:`1.5px solid ${MGRAY}`,borderRadius:8,color:MID,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

// ── Product Card ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProductCard({item,onEdit,onDelete,onAdjust}:{item:ProductItem,onEdit:()=>void,onDelete:()=>void,onAdjust:(delta:number)=>void}){
  const st=stockStatus(item);
  const meta=STATUS_META[st];
  const q=num(item.qty),r=num(item.reorderLevel);
  const barPct=r>0?Math.min(q/r*100,100):q>0?100:0;
  const margin=num(item.sellPrice)>0&&num(item.costPrice)>0?((num(item.sellPrice)-num(item.costPrice))/num(item.sellPrice)*100):null;
  return <div style={card}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:3}}>{item.name||"Unnamed"}</div>
        <div style={{fontSize:12,color:MID}}>{item.cat}{item.sku?` · ${item.sku}`:""}</div>
      </div>
      <span style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:meta.bg,color:meta.c,border:`1px solid ${meta.b}`,flexShrink:0}}>{meta.label}</span>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
      <button onClick={()=>onAdjust(-1)} style={{width:28,height:28,background:LGRAY,border:`1px solid ${MGRAY}`,borderRadius:6,cursor:"pointer",fontSize:16,fontWeight:700,color:DARK,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
      <div style={{flex:1,textAlign:"center"}}>
        <span style={{fontSize:22,fontWeight:800,color:DARK}}>{fmt(item.qty)}</span>
        <span style={{fontSize:12,color:MID,marginLeft:5}}>{item.unit}</span>
      </div>
      <button onClick={()=>onAdjust(1)} style={{width:28,height:28,background:LITE,border:`1px solid ${MID}`,borderRadius:6,cursor:"pointer",fontSize:16,fontWeight:700,color:B,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
    </div>
    {r>0&&<div style={{marginBottom:10}}>
      <div style={{height:6,background:LGRAY,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${barPct}%`,background:meta.bar,borderRadius:3,transition:"width .3s"}}/>
      </div>
      <div style={{fontSize:11,color:MID,marginTop:3}}>Reorder at {fmt(r)} {item.unit}</div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
      {item.costPrice&&<div style={{background:LGRAY,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:2}}>Cost</div><div style={{fontSize:13,fontWeight:800,color:DARK}}>₦{fmt(item.costPrice)}</div></div>}
      {item.sellPrice&&<div style={{background:LITE,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:B,textTransform:"uppercase",marginBottom:2}}>Sell</div><div style={{fontSize:13,fontWeight:800,color:B}}>₦{fmt(item.sellPrice)}</div></div>}
      {margin!==null&&<div style={{background:margin>=30?"#e8f5e9":"#fff7ed",borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:margin>=30?"#2e7d32":"#c2410c",textTransform:"uppercase",marginBottom:2}}>Margin</div><div style={{fontSize:13,fontWeight:800,color:margin>=30?"#2e7d32":"#c2410c"}}>{Math.round(margin)}%</div></div>}
    </div>
    {item.note&&<div style={{fontSize:12,color:MID,marginBottom:10,fontStyle:"italic"}}>{item.note}</div>}
    <div style={{display:"flex",gap:7}}>
      <button onClick={onEdit} style={{padding:"5px 12px",background:LITE,border:`1.5px solid ${MID}`,borderRadius:7,color:B,fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>
      <button onClick={()=>{if(window.confirm("Delete this item?"))onDelete();}} style={{padding:"5px 12px",background:"#fdecea",border:"1.5px solid #f5c6cb",borderRadius:7,color:"#c0392b",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
    </div>
  </div>;
}

// ── Service Card ─────────────────────────────────────────────────────────
function ServiceCard({item,onEdit,onDelete,onToggle}:{item:ServiceItem,onEdit:()=>void,onDelete:()=>void,onToggle:()=>void}){
  const weekly=num(item.slotsPerWeek)*num(item.price);
  return <div style={card}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:10}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:800,color:DARK,marginBottom:3}}>{item.name||"Unnamed"}</div>
        <div style={{fontSize:12,color:MID}}>{item.cat}{item.duration?` · ${item.duration}`:""}</div>
      </div>
      <button onClick={onToggle} style={{padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:item.available?"#e8f5e9":"#f2f5f5",color:item.available?"#2e7d32":MID,border:`1px solid ${item.available?"#a5d6a7":MGRAY}`,cursor:"pointer",flexShrink:0}}>{item.available?"Available":"Unavailable"}</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      {item.price&&<div style={{background:LITE,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:B,textTransform:"uppercase",marginBottom:2}}>Price</div><div style={{fontSize:13,fontWeight:800,color:B}}>₦{fmt(item.price)}</div></div>}
      {weekly>0&&<div style={{background:LGRAY,borderRadius:7,padding:"7px 9px"}}><div style={{fontSize:9,fontWeight:700,color:MID,textTransform:"uppercase",marginBottom:2}}>Weekly Rev.</div><div style={{fontSize:13,fontWeight:800,color:DARK}}>₦{fmt(weekly)}</div></div>}
    </div>
    {item.note&&<div style={{fontSize:12,color:MID,marginBottom:10,fontStyle:"italic"}}>{item.note}</div>}
    <div style={{display:"flex",gap:7}}>
      <button onClick={onEdit} style={{padding:"5px 12px",background:LITE,border:`1.5px solid ${MID}`,borderRadius:7,color:B,fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>
      <button onClick={()=>{if(window.confirm("Delete this service?"))onDelete();}} style={{padding:"5px 12px",background:"#fdecea",border:"1.5px solid #f5c6cb",borderRadius:7,color:"#c0392b",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
    </div>
  </div>;
}

// ── Inventory Tool ────────────────────────────────────────────────────────
function InventoryTool({code,onSignOut}:{code:string,onSignOut:()=>void}){
  const [bizType,setBizType]=useState<"product"|"service">("product");
  const [products,setProducts]=useState<ProductItem[]>([]);
  const [services,setServices]=useState<ServiceItem[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [saved,setSaved]=useState(false);
  const [saveTimer,setSaveTimer]=useState<ReturnType<typeof setTimeout>|null>(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [editingProduct,setEditingProduct]=useState<ProductItem|null>(null);
  const [editingService,setEditingService]=useState<ServiceItem|null>(null);
  const [addingProduct,setAddingProduct]=useState(false);
  const [addingService,setAddingService]=useState(false);

  useEffect(()=>{
    async function load(){
      try{const res=await fetch(`/api/tools-data?code=${encodeURIComponent(code)}&tool=inventory`);if(res.ok){const j=await res.json();if(j.data){setProducts(j.data.products||[]);setServices(j.data.services||[]);if(j.data.bizType)setBizType(j.data.bizType);setLoaded(true);return;}}}catch{}
      try{const s=localStorage.getItem("pds-inventory-data");if(s){const p=JSON.parse(s);setProducts(p.products||[]);setServices(p.services||[]);if(p.bizType)setBizType(p.bizType);}}catch{}
      setLoaded(true);
    }
    load();
  },[code]);

  const save=useCallback((prods:ProductItem[],svcs:ServiceItem[],bt:string)=>{
    const data={products:prods,services:svcs,bizType:bt};
    try{localStorage.setItem("pds-inventory-data",JSON.stringify(data));}catch{}
    if(saveTimer)clearTimeout(saveTimer);
    const t=setTimeout(async()=>{try{await fetch("/api/tools-data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,tool:"inventory",data})});}catch{}},1500);
    setSaveTimer(t);setSaved(true);setTimeout(()=>setSaved(false),1800);
  },[code,saveTimer]);

  const saveProduct=(item:ProductItem)=>{
    if(!item.name.trim()){alert("Please enter a product name.");return;}
    const n=products.some(p=>p.id===item.id)?products.map(p=>p.id===item.id?item:p):[...products,item];
    setProducts(n);save(n,services,bizType);setEditingProduct(null);setAddingProduct(false);
  };
  const saveService=(item:ServiceItem)=>{
    if(!item.name.trim()){alert("Please enter a service name.");return;}
    const n=services.some(s=>s.id===item.id)?services.map(s=>s.id===item.id?item:s):[...services,item];
    setServices(n);save(products,n,bizType);setEditingService(null);setAddingService(false);
  };
  const deleteProduct=(id:string)=>{const n=products.filter(p=>p.id!==id);setProducts(n);save(n,services,bizType);};
  const deleteService=(id:string)=>{const n=services.filter(s=>s.id!==id);setServices(n);save(products,n,bizType);};
  const adjustQty=(id:string,delta:number)=>{const n=products.map(p=>p.id===id?{...p,qty:String(Math.max(0,num(p.qty)+delta))}:p);setProducts(n);save(n,services,bizType);};
  const toggleAvail=(id:string)=>{const n=services.map(s=>s.id===id?{...s,available:!s.available}:s);setServices(n);save(products,n,bizType);};
  const changeBizType=(bt:"product"|"service")=>{setBizType(bt);save(products,services,bt);};

  const outItems=products.filter(p=>stockStatus(p)==="out");
  const lowItems=products.filter(p=>["low","critical"].includes(stockStatus(p)));
  const stockValue=products.reduce((a,p)=>a+num(p.qty)*num(p.costPrice),0);
  const potRevenue=products.reduce((a,p)=>a+num(p.qty)*num(p.sellPrice),0);

  const filteredProducts=products.filter(p=>{
    const matchSearch=!search||p.name.toLowerCase().includes(search.toLowerCase())||p.cat.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase());
    const st=stockStatus(p);
    const matchFilter=filter==="all"||(filter==="low"&&["low","critical"].includes(st))||(filter==="out"&&st==="out");
    return matchSearch&&matchFilter;
  });
  const filteredServices=services.filter(s=>{
    const matchSearch=!search||s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==="all"||(filter==="available"&&s.available);
    return matchSearch&&matchFilter;
  });

  if(!loaded)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",color:MID,fontSize:14}}>Loading your data...</div>;

  return <div style={{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",minHeight:"100vh",background:LGRAY}}>
    <div style={{background:DARK,padding:"13px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)",letterSpacing:1.2,textTransform:"uppercase"}}>Prowess Digital Solutions · 2026</div>
        <div style={{fontSize:18,fontWeight:800,color:W,marginTop:2}}>Inventory Manager</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Prowess Digital Solutions</div>
        <div style={{fontSize:11,fontWeight:600,color:saved?"#81c784":"rgba(255,255,255,.4)",marginTop:2}}>{saved?"✓ Saved":"Auto-saving..."}</div>
      </div>
    </div>
    <div style={{background:B,padding:"9px 22px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div style={{display:"inline-flex",background:"rgba(0,0,0,.2)",borderRadius:9,padding:3,gap:2}}>
        {(["product","service"] as const).map(t=><button key={t} onClick={()=>changeBizType(t)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:bizType===t?W:"transparent",color:bizType===t?B:"rgba(255,255,255,.6)"}}>{t==="product"?"Product Business":"Service Business"}</button>)}
      </div>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <a href="/tools" style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,textDecoration:"none"}}>← Tools</a>
        <button onClick={onSignOut} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:7,color:W,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sign Out</button>
      </div>
    </div>
    <div style={{padding:"18px 22px",maxWidth:1100,margin:"0 auto"}}>
      {bizType==="product"&&<>
        {outItems.length>0&&<div style={{background:"#fdecea",border:"1.5px solid #f5c6cb",borderRadius:10,padding:"10px 16px",marginBottom:10,fontSize:13,fontWeight:700,color:"#c0392b"}}>⛔ {outItems.length} item{outItems.length>1?"s":""} out of stock: {outItems.map(i=>i.name).join(", ")}</div>}
        {lowItems.length>0&&!outItems.length&&<div style={{background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:10,padding:"10px 16px",marginBottom:10,fontSize:13,fontWeight:700,color:"#c2410c"}}>⚠ {lowItems.length} item{lowItems.length>1?"s":""} running low: {lowItems.map(i=>i.name).join(", ")}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
          <KPI accent label="Total Items" val={String(products.length)} sub={`${products.filter(p=>stockStatus(p)==="ok").length} in stock`}/>
          <KPI warn={lowItems.length>0||outItems.length>0} label="Low / Out of Stock" val={String(lowItems.length+outItems.length)} sub={outItems.length>0?`${outItems.length} out of stock`:""}/>
          <KPI label="Stock Value (Cost)" val={`₦${fmt(stockValue)}`}/>
          <KPI green label="Potential Revenue" val={`₦${fmt(potRevenue)}`}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." style={{padding:"8px 12px",border:`1.5px solid ${MGRAY}`,borderRadius:9,fontSize:13,outline:"none",flex:1,minWidth:180,background:W}}/>
          {(["all","low","out"]).map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${filter===f?B:MGRAY}`,background:filter===f?B:W,color:filter===f?W:MID,fontSize:12,fontWeight:700,cursor:"pointer"}}>{f==="all"?"All Stock":f==="low"?"Low Stock":"Out of Stock"}</button>)}
          <button onClick={()=>{setAddingProduct(true);setEditingProduct(null);}} style={{padding:"8px 16px",background:B,border:"none",borderRadius:9,color:W,fontSize:13,fontWeight:700,cursor:"pointer",marginLeft:"auto"}}>+ Add Product</button>
        </div>
        {addingProduct&&<ProductForm item={blankProduct()} onSave={saveProduct} onCancel={()=>setAddingProduct(false)}/>}
        {editingProduct&&<ProductForm item={editingProduct} onSave={saveProduct} onCancel={()=>setEditingProduct(null)}/>}
        {filteredProducts.length===0&&!addingProduct&&<div style={{textAlign:"center",padding:"48px 20px",color:MID}}><div style={{fontSize:36,marginBottom:12}}>📦</div><div style={{fontSize:15,fontWeight:800,color:DARK,marginBottom:8}}>{products.length===0?"No products yet":"Nothing matches"}</div><p style={{fontSize:13}}>{products.length===0?"Add your first product to start tracking stock.":"Try a different search or filter."}</p></div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {filteredProducts.map(p=><ProductCard key={p.id} item={p} onEdit={()=>{setEditingProduct(p);setAddingProduct(false);}} onDelete={()=>deleteProduct(p.id)} onAdjust={(d)=>adjustQty(p.id,d)}/>)}
        </div>
      </>}
      {bizType==="service"&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
          <KPI accent label="Total Services" val={String(services.length)}/>
          <KPI green label="Available Now" val={String(services.filter(s=>s.available).length)}/>
          <KPI label="Weekly Revenue (if full)" val={`₦${fmt(services.filter(s=>s.available).reduce((a,s)=>a+num(s.slotsPerWeek)*num(s.price),0))}`}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services..." style={{padding:"8px 12px",border:`1.5px solid ${MGRAY}`,borderRadius:9,fontSize:13,outline:"none",flex:1,minWidth:180,background:W}}/>
          {(["all","available"]).map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${filter===f?B:MGRAY}`,background:filter===f?B:W,color:filter===f?W:MID,fontSize:12,fontWeight:700,cursor:"pointer"}}>{f==="all"?"All Services":"Available"}</button>)}
          <button onClick={()=>{setAddingService(true);setEditingService(null);}} style={{padding:"8px 16px",background:B,border:"none",borderRadius:9,color:W,fontSize:13,fontWeight:700,cursor:"pointer",marginLeft:"auto"}}>+ Add Service</button>
        </div>
        {addingService&&<ServiceForm item={blankService()} onSave={saveService} onCancel={()=>setAddingService(false)}/>}
        {editingService&&<ServiceForm item={editingService} onSave={saveService} onCancel={()=>setEditingService(null)}/>}
        {filteredServices.length===0&&!addingService&&<div style={{textAlign:"center",padding:"48px 20px",color:MID}}><div style={{fontSize:36,marginBottom:12}}>🛠</div><div style={{fontSize:15,fontWeight:800,color:DARK,marginBottom:8}}>{services.length===0?"No services yet":"Nothing matches"}</div><p style={{fontSize:13}}>{services.length===0?"Add your services to manage availability and pricing.":"Try a different search or filter."}</p></div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {filteredServices.map(s=><ServiceCard key={s.id} item={s} onEdit={()=>{setEditingService(s);setAddingService(false);}} onDelete={()=>deleteService(s.id)} onToggle={()=>toggleAvail(s.id)}/>)}
        </div>
      </>}
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

export default function InventoryPage(){
  const [code,setCode]=useState("");
  const [grantedCode,setGrantedCode]=useState<string|null>(null);
  const [status,setStatus]=useState<"idle"|"checking"|"denied"|"granted">("idle");
  const [reason,setReason]=useState("");

  useEffect(()=>{
    const raw=localStorage.getItem("pds-access-inventory");
    if(!raw)return;
    try{const saved=JSON.parse(raw) as {code:string};silentVerify(saved.code);}
    catch{localStorage.removeItem("pds-access-inventory");}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function silentVerify(savedCode:string){
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:savedCode})});
      const data=await res.json();
      if(data.valid){setGrantedCode(savedCode);setStatus("granted");localStorage.setItem("pds-access-inventory",JSON.stringify({code:savedCode}));}
      else{localStorage.removeItem("pds-access-inventory");}
    }catch{localStorage.removeItem("pds-access-inventory");}
  }

  async function verify(){
    setStatus("checking");
    try{const res=await fetch("/api/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.trim()})});
      const data=await res.json();
      if(data.valid){const c=code.trim().toUpperCase();setGrantedCode(c);setStatus("granted");localStorage.setItem("pds-access-inventory",JSON.stringify({code:c}));}
      else{setReason(data.reason??"invalid");setStatus("denied");localStorage.removeItem("pds-access-inventory");}
    }catch{setReason("invalid");setStatus("denied");}
  }

  function signOut(){localStorage.removeItem("pds-access-inventory");setGrantedCode(null);setCode("");setStatus("idle");}

  if(grantedCode)return <InventoryTool code={grantedCode} onSignOut={signOut}/>;

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
            <h1 className="g-headline">Know your stock.<br/><span className="hi">Never run out again.</span></h1>
            <p className="g-body-txt">Running out of stock is running out of money. This tool keeps you on top of every item, sends alerts before you hit zero, and tracks your margins in real time.</p>
            <div className="g-pills">
              {[{icon:"📦",title:"Product Stock Tracking",sub:"Quantities, reorder levels, and live alerts"},{icon:"🛠",title:"Service Availability",sub:"Toggle on or off, manage slots and pricing"},{icon:"⚠",title:"Low Stock Alerts",sub:"Warning banners before you run out"},{icon:"📊",title:"Stock Value at a Glance",sub:"Cost value and potential revenue in one view"}].map((f,i)=>(
                <div key={i} className="g-pill"><div className="g-pill-icon">{f.icon}</div><div className="g-pill-text"><span className="g-pill-title">{f.title}</span><span className="g-pill-sub">{f.sub}</span></div></div>
              ))}
            </div>
          </div>
          <div className="g-card">
            <div className="g-card-inner">
              <div className="g-card-glow"/>
              <div className="g-card-eyebrow">Client Access</div>
              <div className="g-card-title">Inventory Manager</div>
              <div className="g-card-sub">Enter your Prowess Digital Solutions access code to unlock.</div>
              <span className="g-code-label">Your access code</span>
              <input value={code} placeholder="PDS-XXXX-XXXX" onChange={e=>{setCode(e.target.value.toUpperCase());setStatus("idle");}} onKeyDown={e=>e.key==="Enter"&&verify()} disabled={status==="checking"} autoComplete="off" className={`g-code-input${status==="denied"?" err":""}`}/>
              <div className="g-err-txt">{status==="denied"?(REASON_MSG[reason]??REASON_MSG.invalid):""}</div>
              <button onClick={verify} disabled={status==="checking"||!code.trim()} className="g-submit">{status==="checking"?"Verifying your code...":"Unlock Inventory Manager →"}</button>
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