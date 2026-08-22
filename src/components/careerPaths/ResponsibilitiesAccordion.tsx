import { Accordion, type AccordionItem } from "@/components/Accordion";
import { RichText } from "@/components/RichText";

export type ResponsibilityData = { id: string; title: string; body: string | null };

// Thin data-mapping wrapper -- the interactive part lives in Accordion.
// Rendered from a server component (the career path detail page), so this
// stays server-side too; only Accordion itself needs "use client".
export function ResponsibilitiesAccordion({ items }: { items: ResponsibilityData[] }) {
  const accordionItems: AccordionItem[] = items.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body ? <RichText html={r.body} /> : <p className="text-sm text-muted-foreground">No further detail yet.</p>,
  }));
  return <Accordion items={accordionItems} />;
}
