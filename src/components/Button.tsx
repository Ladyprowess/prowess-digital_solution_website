import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "white";
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;

  // ✅ add disabled support
  disabled?: boolean;

  // ✅ optional: allow title/aria props if you use them later
  title?: string;
  ariaLabel?: string;
};

function isExternal(href?: string) {
  if (!href) return false;
  return href.startsWith("http://") || href.startsWith("https://");
}

export default function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
  disabled = false,
  title,
  ariaLabel,
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm sm:text-base font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-[rgba(80,124,128,0.35)] focus:ring-offset-2";

  const styles = {
    primary: "bg-[var(--steel-teal)] text-white shadow-sm hover:opacity-95",
    secondary:
      "bg-white text-slate-900 border border-[rgba(15,23,42,0.12)] hover:bg-slate-50",
    white: "bg-white text-slate-900 shadow-sm hover:bg-slate-50",
  }[variant];

  // ✅ make disabled look disabled
  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";

  const classes = clsx(base, styles, disabledStyles, className);

  // Normal button (no href)
  if (!href) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={classes}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  // ✅ if disabled and it's a link, do nothing (no navigation)
  if (disabled) {
    return (
      <span className={classes} title={title} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  // External link
  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        title={title}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  // Internal link
  return (
    <Link href={href} className={classes} title={title} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
