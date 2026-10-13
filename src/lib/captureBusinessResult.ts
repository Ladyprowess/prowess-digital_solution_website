/** Capture the visible result, excluding its action controls. No input leaves the browser. */
export async function captureBusinessResult(source: HTMLElement): Promise<string> {
 await document.fonts.ready;
 const clone=source.cloneNode(true) as HTMLElement;
 const originals=[source,...source.querySelectorAll<HTMLElement>('*')];
 const copies=[clone,...clone.querySelectorAll<HTMLElement>('*')];
 originals.forEach((element,i)=>{
  const style=getComputedStyle(element);
  for(const property of Array.from(style)) copies[i].style.setProperty(property,style.getPropertyValue(property));
  copies[i].style.animation='none';copies[i].style.transition='none';
  copies[i].style.fontFamily=style.fontFamily.includes('mono')?'"Courier New", monospace':'Arial, sans-serif';
 });
 clone.querySelectorAll('button,a,[data-export-exclude]').forEach(element=>element.remove());
 const width=Math.ceil(source.getBoundingClientRect().width);
 clone.style.width=`${width}px`;clone.style.height='auto';clone.style.minHeight='0';clone.style.transform='none';clone.style.margin='0';
 const holder=document.createElement('div');holder.style.cssText=`position:fixed;left:-10000px;top:0;width:${width}px;`;holder.append(clone);document.body.append(holder);
 const height=Math.ceil(clone.getBoundingClientRect().height);holder.remove();
 const markup=new XMLSerializer().serializeToString(clone);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
 const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
 await image.decode();
 const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export unavailable');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0);
 return canvas.toDataURL('image/png');
}
