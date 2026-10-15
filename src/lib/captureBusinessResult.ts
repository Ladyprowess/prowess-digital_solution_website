/** Keep the displayed result's words and values; lay them out on a readable paper slip. */
export const receiptStyles=`
*{box-sizing:border-box}body{margin:0;background:#f1f0eb;color:#243638;font:14px/1.65 "Courier New",monospace}.receipt{width:440px;max-width:100%;margin:0 auto;background:#fffef9;padding:28px 26px 36px;position:relative}.receipt:after{content:"";position:absolute;bottom:0;left:0;width:100%;height:10px;background:linear-gradient(135deg,transparent 50%,#f1f0eb 50%),linear-gradient(225deg,transparent 50%,#f1f0eb 50%);background-size:20px 20px}.brand{text-align:center;font-size:17px;font-weight:bold;letter-spacing:1px;padding-bottom:20px;margin-bottom:22px;border-bottom:1px dashed #8da5a5}.content{overflow-wrap:anywhere}.content *{max-width:100%;min-width:0}.content div,.content section,.content article{margin:0}.content header{font-size:11px;border-bottom:1px dashed #bcc9c5;padding-bottom:12px;margin-bottom:16px}.content h2,.content h3{font-size:17px;line-height:1.45;letter-spacing:.03em;margin:16px 0 10px;color:#243638}.content h4,.content h5{font-size:16px;line-height:1.4;margin:16px 0 8px}.content p{margin:10px 0}.content small{display:block;font-size:11px;line-height:1.6;margin:12px 0}.content em{font-style:normal;color:#507c80}.content label{display:block;font-size:13px;margin:10px 0}.content svg{display:none}.content .receipt-row{display:flex;gap:16px;justify-content:space-between;border-bottom:1px dashed #bcc9c5;padding:10px 0}.content .receipt-row b{text-align:right}.content .receipt-total{font-size:28px;font-weight:bold;border-block:1px dashed #bcc9c5;padding:18px 0;margin:16px 0}.content .receipt-stamp{text-align:center;font-weight:bold;color:#507c80;border:2px solid #507c80;width:fit-content;padding:8px 12px;margin:20px auto;transform:rotate(-4deg)}.content .receipt-total>span{display:block;font-size:11px;font-weight:400}.content .receipt-section{border-top:1px dashed #bcc9c5;padding:16px 0}.content footer{font-size:11px;border-top:1px dashed #bcc9c5;padding-top:14px;margin-top:18px}.content>header.receipt-meta{letter-spacing:.04em}.content .receipt-text h3{margin-top:0}.content .receipt-text h4{font-size:15px;color:#30585a;margin:4px 0 8px}.content .receipt-text .receipt-section:first-child{border-top:0;padding-top:0}.content .receipt-text .receipt-row span{color:#52615f}.content .receipt-note{text-align:center}h2,h3,h4,h5{break-after:avoid}p,label,.receipt-row{break-inside:avoid}@page{size:140mm 210mm;margin:8mm}@media print{body{background:white;font-size:14px}.receipt{width:100%;padding:12px 14px;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;
export type RenderedReceipt = { image: string; html: string; width: number };

const escapeHtml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const today=()=>new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos',day:'numeric',month:'short',year:'numeric'}).toUpperCase();

// Every printout shares the financial summary's anatomy: brand, a short
// header line, the result, a stamp and a closing note. Results that already
// carry their own header, stamp and note (data-receipt-complete) keep them.
function receiptFrame(title:string,body:string,{complete=false,hasHeader=false,hasStamp=false}={}){
 const header=complete||hasHeader?'':`<header class="receipt-meta">${escapeHtml(title.toUpperCase())}<br>${today()} · YOUR COPY</header>`;
 const stamp=complete||hasStamp?'':'<div class="receipt-stamp">RESULT COMPLETE</div>';
 const note=complete?'':'<small class="receipt-note">Prepared from your entries.<br>Review it before you act on it.</small>';
 return `<main class="receipt"><div class="brand">PROWESS DIGITAL SOLUTIONS</div><div class="content">${header}${body}${stamp}${note}</div></main>`;
}

const HIGHLIGHT=/score|after costs|total|balance|profit/i;
/** Lay out plain-text results (sections separated by blank lines) as receipt rows and notes. */
export function textReceiptBody(content:string){
 const sections=content.split(/\n\s*\n/).map(section=>section.trim()).filter(Boolean);
 return `<div class="receipt-text">${sections.map(section=>{
  const lines=section.split('\n').map(line=>line.trim()).filter(Boolean);
  return `<div class="receipt-section">${lines.map((line,index)=>{
   const colon=line.indexOf(':');
   const label=colon>0?line.slice(0,colon).trim():'';const value=colon>0?line.slice(colon+1).trim():'';
   if(label&&value&&label.length<=40&&!/https?$/i.test(label)){
    if(value.length<=36&&HIGHLIGHT.test(label))return `<div class="receipt-total"><span>${escapeHtml(label)}</span>${escapeHtml(value)}</div>`;
    if(value.length<=36)return `<div class="receipt-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`;
    return `<p><b>${escapeHtml(label)}:</b> ${escapeHtml(value)}</p>`;
   }
   if(/^\d+[.)]\s/.test(line))return `<h4>${escapeHtml(line)}</h4>`;
   if(index===0&&lines.length>1&&line.length<=90)return `<h3>${escapeHtml(line)}</h3>`;
   return `<p>${escapeHtml(line)}</p>`;
  }).join('')}</div>`;
 }).join('')}</div>`;
}

async function renderReceipt(html:string):Promise<RenderedReceipt>{
 await document.fonts.ready;
 const frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-10000px;top:0;width:440px;height:1px;border:0';document.body.append(frame);
 try{
  const doc=frame.contentDocument!;doc.open();doc.write(`<html><head><style>${receiptStyles}</style></head><body>${html}</body></html>`);doc.close();
  const height=Math.ceil(doc.body.scrollHeight);const width=440;
  const markup=new XMLSerializer().serializeToString(doc.documentElement);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
  const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image export unavailable');ctx.scale(2,2);ctx.drawImage(image,0,0);
  return {image:canvas.toDataURL('image/png'),html,width};
 }finally{frame.remove();}
}

export function textReceipt(title:string,content:string){
 return renderReceipt(receiptFrame(title,textReceiptBody(content)));
}

export async function captureBusinessResult(source:HTMLElement,title=''):Promise<RenderedReceipt>{
 const clone=source.cloneNode(true) as HTMLElement;
 const originals=[source,...source.querySelectorAll<HTMLElement>('*')];
 const copies=[clone,...clone.querySelectorAll<HTMLElement>('*')];
 let hasStamp=false;
 originals.forEach((element,i)=>{
  const copy=copies[i];const name=element.className;
  copy.removeAttribute('style');copy.removeAttribute('class');copy.removeAttribute('id');
  if(typeof name==='string'){
   if(/receiptRow/.test(name))copy.className='receipt-row';
   if(/receiptTotal/.test(name))copy.className='receipt-total';
   if(/stamp/.test(name)){copy.className='receipt-stamp';hasStamp=true;}
   if(/(?:_action_|_step_)/.test(name))copy.className='receipt-section';
  }
  if(element instanceof HTMLInputElement){
   if(element.type==='checkbox'||element.type==='radio'){const marker=document.createElement('span');marker.textContent=element.checked?'[✓] ':'[ ] ';copy.replaceWith(marker);}
   else copy.setAttribute('value',element.value);
  }
 });
 clone.querySelectorAll('button,a,[data-export-exclude],script,style').forEach(element=>element.remove());
 // Branding is rendered once above every output.
 clone.querySelectorAll('header,h4,p').forEach(element=>{if(element.textContent?.trim().toLowerCase()==='prowess digital solutions')element.remove();});
 clone.querySelectorAll('header').forEach(header=>{
  header.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent?.replace(/Prowess Digital Solutions/gi,'')??'';});
  header.querySelectorAll('span').forEach(span=>{if(span.textContent?.trim()==='Prowess Digital Solutions')span.remove();});
 });
 const complete='receiptComplete' in source.dataset;
 // Short on-screen labels ("SOP", "REVIEW") give way to the shared header
 // line, so every printout opens with its title and date.
 if(!complete)clone.querySelectorAll('header').forEach(header=>{if((header.textContent||'').trim().length<=40)header.remove();});
 // Adjacent inline elements on screen are separated by layout, not spaces.
 clone.querySelectorAll('span,b,strong,em').forEach(element=>{if(element.nextSibling?.nodeType===Node.ELEMENT_NODE)element.after(' ');});
 const hasHeader=Boolean(clone.querySelector('header'));
 return renderReceipt(receiptFrame(title,clone.innerHTML,{complete,hasHeader,hasStamp}));
}
