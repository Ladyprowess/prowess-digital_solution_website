import { emailFrame, emailFields, emailButton } from './layout';
import { escapeEmail } from '../payments/emailEscape';
type Submission={fullName:string;email:string;phone:string;targetRole:string;careerLevel:string;reviewFocus:string;fileName:string;fileSize:number};
export function cvAdminEmail(s:Submission,fileUrl:string|null) {
 return {subject:'New CV review request',html:emailFrame('A CV is ready for review',`<p>A Premium member has submitted a CV for manual review.</p>${emailFields([['Name',s.fullName],['Email',s.email],['Target role',s.targetRole],['Career level',s.careerLevel],['Review focus',s.reviewFocus||'General CV review'],['Phone',s.phone||'Not provided'],['Document',`${s.fileName} (${Math.ceil(s.fileSize/1024)} KB)`]])}${fileUrl?emailButton('Open CV document',fileUrl):'<p>The document is stored with the submission. A download link could not be created.</p>'}<p style="font-size:12px;color:#52686a">The document link expires in seven days. Reply to this email to contact the member.</p>`) };
}
export function cvCustomerEmail(s:Submission) {
 return {subject:'Your CV review request has been received',html:emailFrame('Your CV is with us',`<p>Hello ${escapeEmail(s.fullName)},</p><p>Your CV has been submitted to Prowess Digital Solutions for a manual review.</p>${emailFields([['Target role',s.targetRole],['Document',s.fileName],['Review focus',s.reviewFocus||'General CV review']])}<h2 style="font-size:18px;margin-top:24px">What happens next</h2><p>The team will review your CV and send practical feedback to this email address.</p><p>You can reply if you need to clarify your target role or review priorities.</p>${emailButton('Explore interview preparation','https://www.prowessdigitalsolutions.com/tools/interview-prep')}`)};
}
