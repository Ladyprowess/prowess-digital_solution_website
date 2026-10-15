// Only allow local destinations when continuing a member's sign-in journey.
export function memberRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return "/account";
  return value;
}

export function memberLoginUrl(destination: string): string {
  return `/account/login?redirect=${encodeURIComponent(memberRedirect(destination))}`;
}
