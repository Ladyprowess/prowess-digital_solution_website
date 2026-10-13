export function businessScenario(price: string, cost: string, units: string, fixed: string) {
 const entries = [price, cost, units, fixed];
 const values = entries.map(Number);
 if (entries.some(value => !value.trim()) || values.some(value => !Number.isFinite(value) || value < 0) || !Number.isInteger(values[2])) return null;
 const [p,c,u,f] = values;
 const revenue = p*u;
 const contribution = p-c;
 const profit = contribution*u-f;
 const breakEven = contribution > 0 ? Math.ceil(f/contribution) : null;
 if (![revenue, profit].every(Number.isFinite) || (breakEven !== null && !Number.isFinite(breakEven))) return null;
 return { revenue, profit, breakEven };
}
