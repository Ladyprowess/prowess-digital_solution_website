/** Keep the displayed result's words and values; lay them out on a readable paper slip. */
export const receiptStyles=`
*{box-sizing:border-box}body{margin:0;background:#f1f0eb;color:#243638;font:14px/1.65 "Courier New",monospace}.receipt{width:440px;max-width:100%;margin:0 auto;background:#fffef9;padding:28px 26px 36px;position:relative}.receipt:after{content:"";position:absolute;bottom:0;left:0;width:100%;height:10px;background:linear-gradient(135deg,transparent 50%,#f1f0eb 50%),linear-gradient(225deg,transparent 50%,#f1f0eb 50%);background-size:20px 20px}.brand{text-align:center;font-size:17px;font-weight:bold;letter-spacing:1px;padding-bottom:20px;margin-bottom:22px;border-bottom:1px dashed #8da5a5}.content{overflow-wrap:anywhere}.content *{max-width:100%;min-width:0}.content div,.content section,.content article{margin:0}.content header{font-size:11px;border-bottom:1px dashed #bcc9c5;padding-bottom:12px;margin-bottom:16px}.content h2,.content h3{font-size:23px;line-height:1.3;margin:16px 0;color:#30585a}.content h4,.content h5{font-size:16px;line-height:1.4;margin:16px 0 8px}.content p{margin:10px 0}.content small{display:block;font-size:11px;line-height:1.6;margin:12px 0}.content em{font-style:normal;color:#507c80}.content label{display:block;font-size:13px;margin:10px 0}.content svg{display:none}.content .receipt-row{display:flex;gap:16px;justify-content:space-between;border-bottom:1px dashed #bcc9c5;padding:10px 0}.content .receipt-row b{text-align:right}.content .receipt-total{font-size:28px;font-weight:bold;border-block:1px dashed #bcc9c5;padding:18px 0;margin:16px 0}.content .receipt-stamp{text-align:center;font-weight:bold;color:#507c80;border:2px solid #507c80;width:fit-content;padding:8px 12px;margin:20px auto;transform:rotate(-4deg)}.content .receipt-total>span{display:block;font-size:11px;font-weight:400}.content .receipt-section{border-top:1px dashed #bcc9c5;padding:16px 0}.content footer{font-size:11px;border-top:1px dashed #bcc9c5;padding-top:14px;margin-top:18px}h2,h3,h4,h5{break-after:avoid}p,label,.receipt-row{break-inside:avoid}@page{size:140mm 210mm;margin:8mm}@media print{body{background:white;font-size:14px}.receipt{width:100%;padding:12px 14px;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;
export async function captureBusinessResult(source:HTMLElement):Promise<{image:string;html:string;width:number}>{
 await document.fonts.ready;
 const clone=source.cloneNode(true) as HTMLElement;
 const originals=[source,...source.querySelectorAll<HTMLElement>('*')];
 const copies=[clone,...clone.querySelectorAll<HTMLElement>('*')];
 originals.forEach((element,i)=>{
  const copy=copies[i];const name=element.className;
  copy.removeAttribute('style');copy.removeAttribute('class');copy.removeAttribute('id');
  if(typeof name==='string'){
   if(/receiptRow/.test(name))copy.className='receipt-row';
   if(/receiptTotal/.test(name))copy.className='receipt-total';
   if(/stamp/.test(name))copy.className='receipt-stamp';
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
 clone.className='content';
 const html=`<main class="receipt"><div class="brand">PROWESS DIGITAL SOLUTIONS</div>${clone.outerHTML}</main>`;
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
