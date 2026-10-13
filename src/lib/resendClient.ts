import { Resend, type CreateEmailOptions, type CreateEmailRequestOptions, type CreateEmailResponse } from 'resend';
import { prepareEmail } from './emails/layout';

let client:Resend|undefined;
/** All application email shares layout preparation and provider-error visibility. */
export const resend = { emails: {
  async send(payload:CreateEmailOptions,options?:CreateEmailRequestOptions):Promise<CreateEmailResponse> {
    const prepared=typeof payload.html==='string'?prepareEmail(payload.html,payload.subject):null;
    client ??= new Resend(process.env.RESEND_API_KEY);
    try {
      const response=await client.emails.send(prepared?({ ...payload, html:prepared.html, text:payload.text||prepared.text } as CreateEmailOptions):payload,options);
      if(response.error)console.error('Email provider rejected message',{code:response.error.name});
      return response;
    } catch(error) {
      console.error('Email provider request failed');
      throw error;
    }
  }
}};
