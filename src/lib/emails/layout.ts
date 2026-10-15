import sanitizeHtml from 'sanitize-html';
import { escapeEmail } from '../payments/emailEscape';

// Email uses inline, fixed brand colours because clients do not load website tokens.
export function emailFrame(title:string, content:string, preheader=title) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f1f5f5;color:#0b1b1d;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeEmail(preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #dce6e6;border-radius:12px"><tr><td style="padding:24px 28px;border-bottom:4px solid #507c80"><p style="margin:0;font-size:14px;font-weight:700;letter-spacing:.5px;color:#365d61">PROWESS DIGITAL SOLUTIONS</p></td></tr><tr><td style="padding:28px"><h1 style="font-size:26px;line-height:1.25;margin:0 0 24px;color:#0b1b1d">${escapeEmail(title)}</h1><div style="font-size:15px;line-height:1.7;color:#30494b;overflow-wrap:anywhere">${content}</div></td></tr><tr><td style="padding:20px 28px;border-top:1px solid #dce6e6;font-size:12px;line-height:1.7;color:#52686a">Prowess Digital Solutions<br><a href="https://www.prowessdigitalsolutions.com" style="color:#365d61">prowessdigitalsolutions.com</a></td></tr></table></td></tr></table></body></html>`;
}
export function emailButton(label:string,url:string) {
  // Only use web destinations in email calls to action.
  if(!/^https?:\/\//i.test(url))return '';
  return `<p style="margin:24px 0"><a href="${escapeEmail(url)}" style="display:inline-block;padding:13px 22px;background:#507c80;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px">${escapeEmail(label)}</a></p>`;
}
export function emailFields(fields:[string,string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fields.map(([label,value])=>`<tr><td style="padding:12px 0;border-bottom:1px solid #e2eaea"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#52686a">${escapeEmail(label)}</p><p style="margin:0;font-size:15px;line-height:1.6;word-break:break-word;color:#0b1b1d">${escapeEmail(value).replace(/\r?\n/g,'<br>')}</p></td></tr>`).join('')}</table>`;
}
export function prepareEmail(html:string,subject:string) {
  // Retain existing designed emails; give plain fragments the same branded frame.
  const designed=/<html\b/i.test(html)||(/<table\b/i.test(html)&&/Prowess Digital Solutions/i.test(html));
  let result=designed?html:emailFrame(subject,html);
  if(!/<html\b/i.test(result))result=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">${result}</body></html>`;
  result=result.replace(/#94a3b8/gi,'#52686a').replace(/font-size:\s*(?:9|10|11|11\.5)px/gi,'font-size:12px');
  const responsive=`<style>img{max-width:100%;height:auto}table{max-width:100%}a{overflow-wrap:anywhere}@media only screen and (max-width:600px){body{margin:0!important}td{word-break:break-word}table[width="600"],table[width="640"]{width:100%!important}}</style>`;
  result=result.replace('</head>',`${responsive}</head>`);
  const text=sanitizeHtml(result.replace(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,'$3 ($2)').replace(/<\/(?:p|h[1-6]|div|tr|table)>|<br\s*\/?\s*>/gi,'\n'),{allowedTags:[],allowedAttributes:{}})
    .replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#(?:0?39|x27);/g,"'").replace(/&amp;/g,'&').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  return {html:result,text};
}
