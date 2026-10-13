export type BusinessSummary = { title: string; content: string; image?: string };
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function summaryDocument({title,content,image}: BusinessSummary) {
 if(image?.startsWith('data:image/png;base64,'))return `<!doctype html><html><head><title>${escape(title)}</title><style>@page{margin:10mm}body{margin:0;text-align:center}img{max-width:100%;width:420px;height:auto}</style></head><body><img src="${image}" alt="${escape(title)}"></body></html>`;
 const renderSection=(section:string)=>section.split('\n').map((line,index)=>{
  const colon=line.indexOf(':');
  if(colon>0 && colon<65){const label=line.slice(0,colon),value=line.slice(colon+1).trim();return `<div class="row ${/score|after costs/i.test(label)?'highlight':''}"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`;}
  return index===0?`<h2>${escape(line)}</h2>`:`<p>${escape(line)}</p>`;
 }).join('');
 const sections=content.split(/\n\s*\n/).filter(Boolean);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)} | Prowess Digital Solutions</title><style>
 @page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;padding:32px;background:#f3f3f1;color:#172326;font:15px/1.7 Arial,sans-serif}.sheet{max-width:760px;margin:auto;background:white;border:1px solid #d9dedd;border-top:6px solid #507c80;border-radius:16px;padding:40px;box-shadow:0 8px 30px #00000008}.brand{font-size:11px;letter-spacing:2px;font-weight:bold;color:#507c80}.label{display:inline-block;margin:24px 0 12px;padding:4px 12px;border:1px solid #b7c9ca;border-radius:20px;font-size:10px;letter-spacing:1px}h1{font-size:32px;line-height:1.15;letter-spacing:-1px;margin:8px 0 28px}.section{padding:18px 0;border-top:1px solid #e2e5e4;overflow-wrap:anywhere;break-inside:avoid}.section h2{font-size:15px;line-height:1.6;margin:0 0 14px;font-weight:700}.section p{margin:8px 0}.row{display:flex;gap:24px;justify-content:space-between;border-bottom:1px solid #eef0ee;padding:9px 0;font-size:13px}.row>span{min-width:110px;color:#52615f}.row>strong{font-weight:500;white-space:pre-wrap;text-align:right}.highlight{display:block;border:0;border-radius:10px;background:#f4f6f5;padding:18px;margin:12px 0}.highlight>strong{display:block;font-size:30px;font-weight:700;text-align:left;margin-top:7px}@media(max-width:500px){.row{display:block}.row>strong{display:block;text-align:left;margin-top:5px}}footer{border-top:2px dashed #bdcbcc;margin-top:24px;padding-top:20px;font-size:11px;color:#546164}.date{font-size:11px;color:#687574;margin-top:12px}@media print{body{background:white;padding:0}.sheet{max-width:none;box-shadow:none;border-radius:0;padding:12px 20px}h1{font-size:28px}.section{break-inside:avoid}footer{break-inside:avoid}}@media(max-width:500px){body{padding:12px}.sheet{padding:24px}h1{font-size:27px}}
 </style></head><body><main class="sheet"><header><div class="brand">PROWESS DIGITAL SOLUTIONS</div><span class="label">BUSINESS PLANNING • PERSONAL COPY</span><h1>${escape(title)}</h1></header>${sections.map(section=>`<div class="section">${renderSection(section)}</div>`).join('')}<footer>Prepared with Prowess Digital Solutions business tools. This is a working planning document, not a completed professional diagnostic.<br>prowessdigitalsolutions.com<div class="date">${escape(new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'long',year:'numeric'}))}</div></footer></main></body></html>`;
}
export async function previewSummary(title: string, content: string, selector?: string) {
 if(selector){
  const source=document.querySelector<HTMLElement>(selector);
  if(source){try{
   const {captureBusinessResult}=await import('./captureBusinessResult');
   const image=await captureBusinessResult(source);
   window.dispatchEvent(new CustomEvent<BusinessSummary>('prowess-summary',{detail:{title,content,image}}));return;
  }catch{window.alert('Unable to prepare your result. Please try again.');return;}}
 }

 window.dispatchEvent(new CustomEvent<BusinessSummary>('prowess-summary',{detail:{title,content}}));
}
