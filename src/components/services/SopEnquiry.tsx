"use client";
import RestoredServiceCommerce from './RestoredServiceCommerce';

const commerceSlugs:Record<string,string>={
  'sop-vault':'sops',
  'financial-tracking-dashboard':'financial-review',
  'go-to-market-offer-playbook':'pricing-offer-review',
};
const commerceTitles:Record<string,string>={
  'sop-vault':'SOPs',
  'financial-tracking-dashboard':'Financial Review',
  'go-to-market-offer-playbook':'Pricing and Offer Review',
};

export default function SopEnquiry({title='SOPs',slug='sop-vault',formId='sop-enquiry'}:{title?:string;slug?:string;formId?:string;heading?:string;requestLabel?:string;requestPlaceholder?:string}={}){
  return <RestoredServiceCommerce slug={commerceSlugs[slug]||slug} title={commerceTitles[slug]||title} id={formId}/>;
}
