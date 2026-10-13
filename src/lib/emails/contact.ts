export type ContactEnquiry = {
  full_name: string;
  email: string;
  phone: string;
  business_stage: string;
  inquiry_type: string;
  message: string;
  source?: "website" | "business_diagnostic";
};

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

function frame(preheader: string, title: string, intro: string, content: string) {
  // Email clients need inline colours and table layout rather than site CSS tokens.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><style>
  @media only screen and (max-width:600px){.outer{padding:16px 8px!important}.body{padding:28px 20px!important}}
  @media (prefers-color-scheme:dark){.canvas{background:#10191a!important}.card{background:#182628!important}.ink{color:#f2f7f7!important}.muted{color:#c0d1d2!important}.panel{background:#223638!important}.rule{border-color:#355052!important}}
  </style></head><body class="canvas" style="margin:0;padding:0;background:#f1f5f5;font-family:Arial,Helvetica,sans-serif;color:#0b1b1d;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escape(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td class="outer" align="center" style="padding:36px 16px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="card" style="max-width:600px;background:#ffffff;border:1px solid #dce6e6;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:24px 28px;background:#365d61;color:#ffffff;border-radius:16px 16px 0 0;"><p style="margin:0;font-size:16px;font-weight:700;letter-spacing:0.2px;">PROWESS DIGITAL SOLUTIONS</p><p style="margin:7px 0 0;font-size:12px;color:#e1eeee;">Clarity. Structure. Growth.</p></td></tr>
  <tr><td class="body" style="padding:32px 28px;">
  <h1 class="ink" style="margin:0 0 14px;font-size:27px;line-height:1.25;letter-spacing:-0.5px;color:#0b1b1d;">${escape(title)}</h1>
  <p class="muted" style="margin:0 0 26px;font-size:15px;line-height:1.7;color:#465e60;">${intro}</p>${content}
  </td></tr><tr><td class="rule" style="padding:20px 28px;border-top:1px solid #dce6e6;"><p class="muted" style="margin:0;font-size:12px;line-height:1.7;color:#465e60;">Prowess Digital Solutions<br><a href="https://prowessdigitalsolutions.com" class="muted" style="color:#365d61;text-decoration:underline;">prowessdigitalsolutions.com</a></p></td></tr>
  </table></td></tr></table></body></html>`;
}

function field(label: string, value: string) {
  return `<tr><td style="padding:0 0 18px;"><p class="muted" style="margin:0 0 5px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#465e60;">${escape(label)}</p><p class="ink" style="margin:0;font-size:15px;line-height:1.6;color:#0b1b1d;overflow-wrap:anywhere;word-break:break-word;">${escape(value)}</p></td></tr>`;
}
function messagePanel(message: string) {
  return `<div class="panel" style="padding:20px;background:#f1f6f6;border-radius:10px;"><p class="muted" style="margin:0 0 10px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#465e60;">Message</p><p class="ink" style="margin:0;font-size:15px;line-height:1.8;color:#0b1b1d;overflow-wrap:anywhere;word-break:break-word;">${escape(message).replace(/\r?\n/g, '<br>')}</p></div>`;
}

export function contactAdminEmail(data: ContactEnquiry) {
  const subject = `New enquiry: ${data.inquiry_type.replace(/[\r\n]/g, ' ')}`;
  const content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${field('Source', data.source === 'business_diagnostic' ? 'Business diagnostic landing page' : 'Website')}${field('Service or topic',data.inquiry_type)}${field('Name',data.full_name)}${field('Email',data.email)}${data.phone ? field('Phone',data.phone) : ''}${data.business_stage ? field('Business stage',data.business_stage) : ''}</table>${messagePanel(data.message)}<p class="muted" style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#465e60;">Reply to this email to respond directly to the enquirer.</p>`;
  return { subject, html: frame('A new website enquiry is ready for your review.', 'A new enquiry has arrived', 'Review the details below and reply when you’re ready.', content), text: `New website enquiry\n\nSource: ${data.source || 'website'}\nTopic: ${data.inquiry_type}\nName: ${data.full_name}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}\nBusiness stage: ${data.business_stage || 'Not provided'}\n\nMessage:\n${data.message}\n\nReply to respond directly to the enquirer.` };
}

export function contactCustomerEmail(data: ContactEnquiry) {
  const next = data.inquiry_type === 'Business Structure Diagnostic'
    ? 'We’ll review your business, challenges and goals to confirm whether the diagnostic is appropriate. If it is, we’ll send payment instructions. Your enquiry does not start a subscription or take payment.'
    : 'We’ll review your message and reply to discuss the next step. You can reply to this email if you have anything to add.';
  return {
    subject: 'We’ve received your enquiry | Prowess',
    html: frame('Thank you for getting in touch. Here’s what happens next.', 'Your enquiry is with us', `Hello ${escape(data.full_name)},<br>Thank you for contacting Prowess Digital Solutions. We’ve received your message.`, `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${field('Your enquiry',data.inquiry_type)}</table><h2 class="ink" style="margin:0 0 10px;font-size:18px;color:#0b1b1d;">What happens next</h2><p class="muted" style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#465e60;">${escape(next)}</p>${messagePanel(data.message)}<p class="muted" style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#465e60;">Thank you,<br>The Prowess team</p>`),
    text: `Hello ${data.full_name},\n\nThank you for contacting Prowess Digital Solutions. We’ve received your enquiry about ${data.inquiry_type}.\n\nWhat happens next\n${next}\n\nYour message:\n${data.message}\n\nThank you,\nThe Prowess team`,
  };
}
