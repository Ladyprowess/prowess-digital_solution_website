"use client";

import { useEffect, useRef } from "react";

export type MockupItem =
  | { key: string; kind: "existing"; url: string }
  | { key: string; kind: "new"; file: File; previewUrl: string };

// Ordered preview gallery for an ebook's mockup images - not a plain file
// list. Same reorder pattern as LearningItemPicker's "Selected learning"
// list (up/down buttons, no drag-and-drop dependency): the cover image is
// shown first as a fixed reference (not part of this array, not
// reorderable), then each mockup as a thumbnail card with up/down + remove.
// New files get an object-URL preview immediately, revoked on removal/
// unmount so they don't leak - existing (already-uploaded) ones just show
// their real URL.
export function MockupGallery({
  coverPreviewUrl,
  items,
  onItemsChange,
}: {
  coverPreviewUrl: string | null;
  items: MockupItem[];
  onItemsChange: (items: MockupItem[]) => void;
}) {
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newItems: MockupItem[] = Array.from(files).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      return { key: `${Date.now()}-${Math.random().toString(16).slice(2)}`, kind: "new", file, previewUrl };
    });
    onItemsChange([...items, ...newItems]);
  }

  function remove(index: number) {
    const item = items[index];
    if (item.kind === "new") {
      URL.revokeObjectURL(item.previewUrl);
      objectUrlsRef.current.delete(item.previewUrl);
    }
    onItemsChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onItemsChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {coverPreviewUrl && (
          <div className="w-28 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreviewUrl} alt="Cover" className="h-28 w-28 rounded-xl border border-border object-cover" />
            <p className="mt-1 text-center text-[11px] text-muted-foreground">Cover</p>
          </div>
        )}

        {items.map((item, index) => (
          <div key={item.key} className="w-28 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.kind === "existing" ? item.url : item.previewUrl}
              alt={`Mockup ${index + 1}`}
              className="h-28 w-28 rounded-xl border border-border object-cover"
            />
            <div className="mt-1 flex items-center justify-center gap-1">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-foreground disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-foreground disabled:opacity-30">↓</button>
              <button type="button" onClick={() => remove(index)} className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-red-600">✕</button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-3 inline-block cursor-pointer rounded-xl border border-dashed border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
        + Add mockup image
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </label>
    </div>
  );
}
