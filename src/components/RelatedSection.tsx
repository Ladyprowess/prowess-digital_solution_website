export function RelatedSection({
  title,
  items,
  render,
}: {
  title: string;
  items: unknown[];
  render: () => React.ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold tracking-widest text-muted-foreground">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{render()}</div>
    </section>
  );
}
