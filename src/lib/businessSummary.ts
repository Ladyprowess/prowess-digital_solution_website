import { receiptStyles } from "./captureBusinessResult";
export type BusinessSummary = { title: string; content: string; image?: string; imageWidth?: number; receiptHtml?: string };
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// The print tab carries its own button and script. In an installed app the
// tab opens outside the app, so controls wired up from the opener never work.
const printControls=`<style>.print-controls{padding:16px;text-align:center;font:16px/1.5 Arial,sans-serif;color:#243638}.print-controls p{margin:0 0 12px}.print-controls button{min-height:48px;padding:12px 22px;border:0;border-radius:8px;background:#507c80;color:#fff;font:600 16px Arial,sans-serif;cursor:pointer;touch-action:manipulation}.print-controls button:focus-visible{outline:3px solid #243638;outline-offset:3px}@media print{.print-controls{display:none}}</style><div class="print-controls"><p>Your complete result is below. Tap Print / Save PDF, or use your browser’s Share menu to save it.</p><button type="button" onclick="window.print()">Print / Save PDF</button></div>`;
export function summaryDocument({title,content,image,receiptHtml}: BusinessSummary, options: { controls?: boolean } = {}) {
 const controls=options.controls?printControls:'';
 if(receiptHtml)return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><style>${receiptStyles}</style></head><body>${controls}${receiptHtml}</body></html>`;
 if(image?.startsWith('data:image/png;base64,'))return `<!doctype html><html><head><title>${escape(title)}</title><style>@page{margin:10mm}body{margin:0;text-align:center}img{max-width:100%;width:420px;height:auto}</style></head><body>${controls}<img src="${image}" alt="${escape(title)}"></body></html>`;
 const renderSection=(section:string)=>section.split('\n').map((line,index)=>{
  const colon=line.indexOf(':');
  if(colon>0 && colon<65){const label=line.slice(0,colon),value=line.slice(colon+1).trim();return `<div class="row ${/score|after costs/i.test(label)?'highlight':''}"><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`;}
  return index===0?`<h2>${escape(line)}</h2>`:`<p>${escape(line)}</p>`;
 }).join('');
 const sections=content.split(/\n\s*\n/).filter(Boolean);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} | Prowess Digital Solutions</title><style>
 @page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;padding:32px;background:#f3f3f1;color:#172326;font:15px/1.7 Arial,sans-serif}.sheet{max-width:760px;margin:auto;background:white;border:1px solid #d9dedd;border-top:6px solid #507c80;border-radius:16px;padding:40px;box-shadow:0 8px 30px #00000008}.brand{font-size:11px;letter-spacing:2px;font-weight:bold;color:#507c80}.label{display:inline-block;margin:24px 0 12px;padding:4px 12px;border:1px solid #b7c9ca;border-radius:20px;font-size:10px;letter-spacing:1px}h1{font-size:32px;line-height:1.15;letter-spacing:-1px;margin:8px 0 28px}.section{padding:18px 0;border-top:1px solid #e2e5e4;overflow-wrap:anywhere;break-inside:avoid}.section h2{font-size:15px;line-height:1.6;margin:0 0 14px;font-weight:700}.section p{margin:8px 0}.row{display:flex;gap:24px;justify-content:space-between;border-bottom:1px solid #eef0ee;padding:9px 0;font-size:13px}.row>span{min-width:110px;color:#52615f}.row>strong{font-weight:500;white-space:pre-wrap;text-align:right}.highlight{display:block;border:0;border-radius:10px;background:#f4f6f5;padding:18px;margin:12px 0}.highlight>strong{display:block;font-size:30px;font-weight:700;text-align:left;margin-top:7px}@media(max-width:500px){.row{display:block}.row>strong{display:block;text-align:left;margin-top:5px}}footer{border-top:2px dashed #bdcbcc;margin-top:24px;padding-top:20px;font-size:11px;color:#546164}.date{font-size:11px;color:#687574;margin-top:12px}@media print{body{background:white;padding:0}.sheet{max-width:none;box-shadow:none;border-radius:0;padding:12px 20px}h1{font-size:28px}.section{break-inside:avoid}footer{break-inside:avoid}}@media(max-width:500px){body{padding:12px}.sheet{padding:24px}h1{font-size:27px}}
 </style></head><body>${controls}<main class="sheet"><header><div class="brand">PROWESS DIGITAL SOLUTIONS</div><span class="label">BUSINESS PLANNING • PERSONAL COPY</span><h1>${escape(title)}</h1></header>${sections.map(section=>`<div class="section">${renderSection(section)}</div>`).join('')}<footer>Prepared from your entries with Prowess Digital Solutions. Review and update this document as your plans change.<div class="date">${escape(new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'long',year:'numeric'}))}</div></footer></main></body></html>`;
}
// Every result prints as the same receipt: on-screen results are captured,
// text results are laid out in the receipt format. If rendering fails, the
// text still opens in the preview so the visitor never loses their result.
export async function previewSummary(title: string, content: string, selector?: string) {
 const source=selector?document.querySelector<HTMLElement>(selector):null;
 if(source||content.trim()){
  try{
   const {captureBusinessResult,textReceipt}=await import('./captureBusinessResult');
   const receipt=source?await captureBusinessResult(source,title):await textReceipt(title,content);
   window.dispatchEvent(new CustomEvent<BusinessSummary>('prowess-summary',{detail:{title,content,image:receipt.image,imageWidth:receipt.width,receiptHtml:receipt.html}}));return;
  }catch{
   if(source&&!content.trim()){window.alert('Unable to prepare your result. Please try again.');return;}
  }
 }
 window.dispatchEvent(new CustomEvent<BusinessSummary>('prowess-summary',{detail:{title,content}}));
}
