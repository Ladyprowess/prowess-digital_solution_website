import type { BusinessSummary } from './businessSummary';
// Render locally to an image: user inputs never leave the browser.
export async function downloadBusinessCard(summary: BusinessSummary) {
 const canvas=document.createElement('canvas');const width=1200;canvas.width=width;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('Image export unavailable');
 const wrap=(text:string,font:string,max:number)=>{ctx!.font=font;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){if(ctx!.measureText(word).width>max){if(line){lines.push(line);line='';}let part='';for(const char of word){if(ctx!.measureText(part+char).width>max){lines.push(part);part='';}part+=char;}line=part;}else if(ctx!.measureText(line+' '+word).width>max&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
 const title=wrap(summary.title,'bold 52px Arial',960);
 const sections=summary.content.split(/\n\s*\n/).filter(Boolean).map(section=>section.split('\n').map((text,index)=>({heading:index===0,lines:wrap(text,index===0?'bold 27px Arial':'26px Arial',920)})));
 const sectionHeight=(section:typeof sections[number])=>section.reduce((n,row)=>n+row.lines.length*39+10,0)+36;
 canvas.height=320+title.length*66+sections.reduce((n,section)=>n+sectionHeight(section),0)+200;
 ctx=canvas.getContext('2d')!;ctx.fillStyle='#f4f4f1';ctx.fillRect(0,0,width,canvas.height);
 ctx.fillStyle='white';ctx.beginPath();ctx.roundRect(36,36,width-72,canvas.height-72,36);ctx.fill();ctx.strokeStyle='#182326';ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle='#507c80';ctx.font='bold 21px Arial';ctx.fillText('PROWESS DIGITAL SOLUTIONS',100,108);
 ctx.fillStyle='#546363';ctx.font='bold 18px Arial';ctx.fillText('YOUR BUSINESS RESULT',100,164);
 let y=244;ctx.fillStyle='#507c80';ctx.font='bold 52px Arial';for(const line of title){ctx.fillText(line,100,y);y+=66;}y+=32;
 for(const section of sections){
  ctx.strokeStyle='#d8deda';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(100,y-16);ctx.lineTo(1100,y-16);ctx.stroke();
  for(const row of section){ctx.font=row.heading?'bold 27px Arial':'26px Arial';ctx.fillStyle=row.heading?'#182326':'#546363';for(const line of row.lines){ctx.fillText(line,120,y+16);y+=39;}y+=10;}y+=36;
 }
 ctx.strokeStyle='#182326';ctx.lineWidth=3;ctx.setLineDash([12,10]);ctx.beginPath();ctx.moveTo(36,y);ctx.lineTo(1164,y);ctx.stroke();ctx.setLineDash([]);
 for(const x of [36,1164]){ctx.fillStyle='#f4f4f1';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.font='bold 20px Arial';ctx.fillStyle='#507c80';ctx.fillText('REVIEW COMPLETE',100,y+52);
 ctx.textAlign='right';ctx.fillText(new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Lagos'}),1100,y+52);ctx.textAlign='left';
 ctx.font='20px Arial';ctx.fillStyle='#546363';ctx.fillText('Based on your inputs. A planning guide, not an independent audit.',100,y+96);ctx.fillText('prowessdigitalsolutions.com',100,y+130);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to create image')),'image/png'));
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='prowess-business-result.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
