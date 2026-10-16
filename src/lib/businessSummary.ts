export type BusinessSummary = { title: string; content: string; image?: string; imageWidth?: number; receiptHtml?: string };
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
