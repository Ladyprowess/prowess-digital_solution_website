"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { journeys } from '@/components/home/journeys';
import { Card } from './AccountUI';

const storageKey = 'pds-home-launchpad-v1';
const actions = new Map(Object.values(journeys).flatMap(j => [...j.tools, ...j.focuses.flatMap(f => f.actions)]).map(a => [a.href, a]));

/** Keep previously saved browser shortcuts accessible without associating them with another account. */
export default function SavedShortcuts() {
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(data?.saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLinks([...new Set<string>(data.saved.filter((href: unknown) => typeof href === 'string' && actions.has(href)))]);
      }
    } catch { /* No readable browser shortcuts. Account bookmarks still load independently. */ }
  }, []);
  function remove(href: string) {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const remaining = Array.isArray(data.saved) ? data.saved.filter((item: unknown) => item !== href) : [];
      localStorage.setItem(storageKey, JSON.stringify({...data, saved: remaining}));
      setLinks(current => current.filter(item => item !== href));
      setError('');
    } catch { setError('This shortcut could not be removed. Please try again.'); }
  }
  if (!links.length) return null;
  return <div className="mt-6"><Card title="Saved shortcuts"><p className="mb-4 text-sm text-muted-foreground">Links you previously saved on the homepage in this browser. These stay on this device.</p>{error && <p role="alert">{error}</p>}<ul className="space-y-2">{links.map(href => <li key={href} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"><Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{actions.get(href)!.title}</Link><button onClick={() => remove(href)} aria-label={`Remove ${actions.get(href)!.title}`} className="text-xs font-semibold text-red-600 hover:underline">Remove</button></li>)}</ul></Card></div>;
}
