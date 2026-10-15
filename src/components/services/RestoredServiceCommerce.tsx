"use client";
import ServiceTestimonials from "./ServiceTestimonials";
import ServiceCheckout from "./ServiceCheckout";
import s from "./RestoredServiceCommerce.module.css";

export default function RestoredServiceCommerce({slug,title,id}:{slug:string;title:string;id:string}){
  return <div className={s.commerce}>
    <div className={s.reviews}><div className={s.inner}><ServiceTestimonials slug={slug}/></div></div>
    <section id={id} className={s.payment}><ServiceCheckout slug={slug} title={title}/></section>
  </div>;
}
