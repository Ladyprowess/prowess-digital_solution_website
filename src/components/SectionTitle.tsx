export default function SectionTitle({ title, desc }: { title: string; desc?: string }) {
    return (
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
        {desc ? <p className="mt-2 text-slate-600">{desc}</p> : null}
      </div>
    );
  }
  