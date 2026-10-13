import type { BusinessSummary } from './businessSummary';
// Render locally to an image: user inputs never leave the browser.
export async function downloadBusinessCard(summary: BusinessSummary) {
 if(summary.image){
  const encoded=summary.image.split(',')[1];
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const file=new File([bytes],'prowess-business-result.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file],title:summary.title});return;}
   catch(error){if(error instanceof DOMException&&error.name==='AbortError')return;throw error;}
  }
  saveBlob(file);return;
 }
 const canvas=document.createElement('canvas');const width=760;canvas.width=width;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('Image export unavailable');
 const wrap=(text:string,font:string,max:number)=>{ctx!.font=font;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){if(ctx!.measureText(word).width>max){if(line){lines.push(line);line='';}let part='';for(const char of word){if(ctx!.measureText(part+char).width>max){lines.push(part);part='';}part+=char;}line=part;}else if(ctx!.measureText(line+' '+word).width>max&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
 const regular='22px "Courier New", monospace';
 const bold='bold 22px "Courier New", monospace';
 const titleFont='bold 34px "Courier New", monospace';
 const title=wrap(summary.title.toUpperCase(),titleFont,596);
 const sections=summary.content.split(/\n\s*\n/).filter(Boolean).map(section=>section.split('\n').map((text,index)=>({heading:index===0,lines:wrap(text,index===0?bold:regular,596)})));
 const bodyHeight=sections.reduce((n,section)=>n+section.reduce((sum,row)=>sum+row.lines.length*31+8,0)+28,0);
 canvas.height=300+title.length*43+bodyHeight+220;
 ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#efeeea';ctx.fillRect(0,0,width,canvas.height);
 // A continuous paper strip with torn edges, rather than a bordered report card.
 const left=32,right=728,top=24,bottom=canvas.height-24;
 ctx.beginPath();ctx.moveTo(left,top);
 for(let x=left;x<right;x+=24){ctx.lineTo(x+12,top+10);ctx.lineTo(Math.min(x+24,right),top);}
 ctx.lineTo(right,bottom);
 for(let x=right;x>left;x-=24){ctx.lineTo(x-12,bottom-10);ctx.lineTo(Math.max(x-24,left),bottom);}
 ctx.closePath();ctx.fillStyle='#fffef9';ctx.shadowColor='#18232620';ctx.shadowBlur=12;ctx.shadowOffsetY=4;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 const rule=(y:number)=>{ctx!.strokeStyle='#65716d';ctx!.lineWidth=1;ctx!.setLineDash([7,6]);ctx!.beginPath();ctx!.moveTo(82,y);ctx!.lineTo(678,y);ctx!.stroke();ctx!.setLineDash([]);};
 ctx.textAlign='center';ctx.fillStyle='#182326';ctx.font='bold 26px "Courier New", monospace';ctx.fillText('PROWESS DIGITAL',380,88);ctx.fillText('SOLUTIONS',380,121);
 ctx.font='18px "Courier New", monospace';ctx.fillText('BUSINESS REVIEW • PERSONAL COPY',380,162);rule(184);
 let y=233;ctx.fillStyle='#507c80';ctx.font=titleFont;for(const line of title){ctx.fillText(line,380,y);y+=43;}rule(y+10);y+=50;ctx.textAlign='left';
 for(const section of sections){
  for(const row of section){ctx.font=row.heading?bold:regular;ctx.fillStyle='#263331';for(const line of row.lines){ctx.fillText(line,82,y);y+=31;}y+=8;}
  rule(y+2);y+=28;
 }
 ctx.textAlign='center';ctx.fillStyle='#507c80';ctx.font=bold;ctx.fillText('*** REVIEW COMPLETE ***',380,y+23);
 ctx.font='18px "Courier New", monospace';ctx.fillStyle='#52615c';ctx.fillText(new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos'}),380,y+57);
 ctx.fillText('Based on your inputs. A planning guide,',380,y+96);ctx.fillText('not an independent audit.',380,y+123);ctx.fillText('prowessdigitalsolutions.com',380,y+164);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to create image')),'image/png'));
 saveBlob(blob);
}

function saveBlob(blob:Blob){
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='prowess-business-result.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
