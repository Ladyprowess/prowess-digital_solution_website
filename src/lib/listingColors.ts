// Deterministically maps a category/type name to one of the site's 5
// existing chart tokens (globals.css --chart-1..5, already theme-aware for
// light/dark) so listing cards get real visual variety without introducing
// new colors that clash with the site's restrained teal/steel palette.
const CHART_CLASSES = [
  { chip: "bg-chart-1/12 text-chart-1", ring: "hover:border-chart-1/40", bar: "bg-chart-1", tag: "bg-chart-1/8 text-chart-1" },
  { chip: "bg-chart-2/12 text-chart-2", ring: "hover:border-chart-2/40", bar: "bg-chart-2", tag: "bg-chart-2/8 text-chart-2" },
  { chip: "bg-chart-3/12 text-chart-3", ring: "hover:border-chart-3/40", bar: "bg-chart-3", tag: "bg-chart-3/8 text-chart-3" },
  { chip: "bg-chart-4/12 text-chart-4", ring: "hover:border-chart-4/40", bar: "bg-chart-4", tag: "bg-chart-4/8 text-chart-4" },
  { chip: "bg-chart-5/12 text-chart-5", ring: "hover:border-chart-5/40", bar: "bg-chart-5", tag: "bg-chart-5/8 text-chart-5" },
] as const;

export function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CHART_CLASSES[hash % CHART_CLASSES.length];
}
