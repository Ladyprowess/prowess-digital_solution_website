"use client";
import { useEffect, useRef } from "react";

interface Props {
  src: string;
  title: string;
  minHeight?: string;
}

function ToolFrame({ src, title, minHeight = "700px" }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    function onLoad() {
      try {
        const h = iframe!.contentWindow!.document.body.scrollHeight;
        if (h > 400) iframe!.style.height = h + "px";
      } catch {
        if (iframe) iframe.style.height = minHeight;
      }
    }
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [minHeight]);

  return (
    <iframe
      ref={ref}
      src={src}
      title={title}
      style={{ width: "100%", minHeight, border: "none", borderRadius: 12, display: "block" }}
      loading="lazy"
    />
  );
}

export function StartupCalculator({ code }: { code: string }) {
  return <ToolFrame src={`/tools/calculator.html?code=${encodeURIComponent(code)}`} title="Startup Calculator" minHeight="750px" />;
}

export function ProfitTracker({ code }: { code: string }) {
  return <ToolFrame src={`/tools/tracker.html?code=${encodeURIComponent(code)}`} title="Profit and Cashflow Tracker" minHeight="750px" />;
}

export function InvoiceManager({ code }: { code: string }) {
  return <ToolFrame src={`/tools/invoice.html?code=${encodeURIComponent(code)}`} title="Invoice Manager" minHeight="800px" />;
}

export function InventoryManager({ code }: { code: string }) {
  return <ToolFrame src={`/tools/inventory.html?code=${encodeURIComponent(code)}`} title="Inventory Manager" minHeight="800px" />;
}

export function ReachPlanner({ code }: { code: string }) {
  return <ToolFrame src={`/tools/reach.html?code=${encodeURIComponent(code)}`} title="Reach and Growth Planner" minHeight="800px" />;
}

export function CustomerServiceGuide() {
  return <ToolFrame src="/tools/customer-support.html" title="Customer Service Guide" minHeight="700px" />;
}

export function BusinessStarter() {
  return <ToolFrame src="/tools/business-starter.html" title="Business Starter" minHeight="750px" />;
}