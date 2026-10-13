import Link from "next/link";
import { colorForSeed } from "@/lib/listingColors";

const ICON_PATHS = {
  briefcase: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0",
  spark: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
  path: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
  pin: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  tag: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z",
  cash: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
} as const;

function MetaIcon({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name]} />
    </svg>
  );
}

export type ListingCardMeta = { icon: keyof typeof ICON_PATHS; text: string };

const MAX_TAGS = 4;

export function ListingCard({
  href,
  icon,
  colorSeed,
  eyebrow,
  title,
  subtitle,
  meta,
  footer,
  badge,
  description,
  tags,
}: {
  href: string;
  icon: keyof typeof ICON_PATHS;
  colorSeed: string;
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  meta?: ListingCardMeta[];
  footer?: string | null;
  badge?: string | null;
  description?: string | null;
  tags?: string[];
}) {
  const color = colorForSeed(colorSeed);
  const shownTags = tags?.slice(0, MAX_TAGS) || [];
  const extraTags = tags && tags.length > MAX_TAGS ? tags.length - MAX_TAGS : 0;

  return (
    <Link
      href={href}
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${color.ring}`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 ${color.bar} opacity-70 transition-opacity duration-150 ease-out group-hover:opacity-100`} />

      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${color.chip}`}>
          <MetaIcon name={icon} />
        </div>
        {badge && (
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            {badge}
          </span>
        )}
      </div>

      <span className={`mt-4 w-fit rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${color.chip}`}>
        {eyebrow}
      </span>

      <h3 className="mt-3 text-base font-bold leading-snug text-foreground">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>}

      {shownTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shownTags.map((t) => (
            <span key={t} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${color.tag}`}>
              {t}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              +{extraTags} more
            </span>
          )}
        </div>
      )}

      {meta && meta.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <MetaIcon name={m.icon} />
              {m.text}
            </span>
          ))}
        </div>
      )}

      {footer && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <MetaIcon name="clock" />
          {footer}
        </div>
      )}
    </Link>
  );
}
