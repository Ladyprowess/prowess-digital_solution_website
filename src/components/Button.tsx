import React from "react";
import Link from "next/link";
import clsx from "clsx";

type ButtonVariants = "primary" | "secondary" | "white" | "outline";

type CommonProps = {
  variant?: ButtonVariants;
  href?: string;
};

type Props = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

function isExternal(href?: string) {
  if (!href) return false;
  return href.startsWith("http://") || href.startsWith("https://");
}

export default function Button({
  href,
  children,
  variant = "primary",
  className,
  disabled,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm sm:text-base font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-[rgba(80,124,128,0.35)] focus:ring-offset-2";

    const stylesMap: Record<ButtonVariants, string> = {
      primary: "bg-[var(--steel-teal)] text-white shadow-sm hover:opacity-95",
      secondary:
        "bg-white text-slate-900 border border-[rgba(15,23,42,0.12)] hover:bg-slate-50",
      white: "bg-white text-slate-900 shadow-sm hover:bg-slate-50",
      outline:
        "bg-transparent text-[var(--steel-teal)] border border-[var(--steel-teal)] hover:bg-[rgba(80,124,128,0.08)]",
    };
  
    const styles = stylesMap[variant];
  

  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";

  const classes = clsx(base, styles, disabledStyles, className);

  // ✅ If it's a normal button (no href)
  if (!href) {
    const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button className={classes} disabled={disabled} {...buttonProps}>
        {children}
      </button>
    );
  }

  // ✅ If disabled and it's a link, render as <span> (no navigation)
  if (disabled) {
    return <span className={classes}>{children}</span>;
  }

  // ✅ External link
  if (isExternal(href)) {
    const aProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={classes}
        {...aProps}
      >
        {children}
      </a>
    );
  }

  // ✅ Internal link (Next Link)
  // Note: style/className are allowed here via the wrapper anchor behaviour in modern Next.
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
