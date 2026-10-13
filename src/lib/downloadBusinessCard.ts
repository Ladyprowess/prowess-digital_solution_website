import type { BusinessSummary } from './businessSummary';
// Render locally to an image: user inputs never leave the browser.
export async function downloadBusinessCard(summary: BusinessSummary) {
 const canvas=document.createElement('canvas');const width=1200;canvas.width=width;
 let ctx=canvas.getContext('2d');if(!ctx)throw Error('Image export unavailable');
 const wrap=(text:string,font:string,max:number)=>{ctx!.font=font;const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){if(ctx!.measureText(word).width>max){if(line){lines.push(line);line='';}let part='';for(const char of word){if(ctx!.measureText(part+char).width>max){lines.push(part);part='';}part+=char;}line=part;}else if(ctx!.measureText(line+' '+word).width>max&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
 const title=wrap(summary.title,'bold 52px Arial',960);
 const paragraphs=summary.content.split('\n').map(text=>wrap(text,'26px Arial',960));
 canvas.height=240+title.length*66+paragraphs.reduce((n,lines)=>n+Math.max(1,lines.length)*39+12,0)+180;
 ctx=canvas.getContext('2d')!;ctx.fillStyle='#f4f4f1';ctx.fillRect(0,0,width,canvas.height);
 ctx.fillStyle='white';ctx.beginPath();ctx.roundRect(36,36,width-72,canvas.height-72,28);ctx.fill();ctx.strokeStyle='#507c80';ctx.lineWidth=4;ctx.stroke();
 ctx.fillStyle='#507c80';ctx.font='bold 21px Arial';ctx.fillText('PROWESS DIGITAL SOLUTIONS',100,108);ctx.fillStyle='#182326';let y=180;ctx.font='bold 52px Arial';for(const line of title){ctx.fillText(line,100,y);y+=66;}y+=30;
 ctx.font='26px Arial';for(const lines of paragraphs){if(!lines.length)y+=39;for(const line of lines){ctx.fillText(line,100,y);y+=39;}y+=12;}
 ctx.strokeStyle='#c3cccc';ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(100,y+15);ctx.lineTo(1100,y+15);ctx.stroke();ctx.font='20px Arial';ctx.fillStyle='#546363';ctx.fillText('Based on your responses. A planning guide, not an independent audit.',100,y+65);ctx.fillText('prowessdigitalsolutions.com',100,y+98);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Unable to create image')),'image/png'));
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='prowess-business-result.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
