"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, List, Maximize2, Minimize2, Pause, Play, Square, X, ZoomIn, ZoomOut } from "lucide-react";

type SpeechState = "idle" | "extracting" | "playing" | "paused" | "unavailable";
// Structurally identical to ResourceBody's ContentsEntry. Declared here
// rather than imported so the reader stays standalone - ResourceBody pulls
// this component in lazily, and a type import back the other way would tie
// the two files together for no benefit.
type ContentsEntry = { label: string; page: number | null };
type SpeechChunk = { text: string; page: number };
type PdfViewport = { width: number; height: number };
type PdfPageProxy = {
  getTextContent: () => Promise<{ items: unknown[] }>;
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> };
};
type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};
type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (url: string) => { promise: Promise<PdfDocumentProxy> };
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.2;
// Horizontal breathing room around each page. Subtracted before scaling so
// 100% really is "fits the width" - without it a full-width page plus its
// own gutter overflowed and put a sideways scrollbar on every document.
const PAGE_GUTTER = 24;

// Deliberately short. Chrome stops synthesising silently somewhere around
// fifteen seconds into a single utterance, which is what made playback
// "stop until you scroll" - the nudge of any interaction was restarting
// it. At ~180 characters a chunk runs roughly ten seconds at normal
// speed, comfortably inside that limit, and it also gives the reader a
// fine-grained position to follow while it scrolls.
const CHUNK_LENGTH = 180;

function chunkText(text: string, maxLength = CHUNK_LENGTH) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let rest = normalized;
  while (rest.length > maxLength) {
    const slice = rest.slice(0, maxLength);
    const splitAt = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("? "), slice.lastIndexOf("! "), slice.lastIndexOf("; "), slice.lastIndexOf(", "));
    const cut = splitAt > maxLength * 0.45 ? splitAt + 1 : slice.lastIndexOf(" ");
    const end = cut > 0 ? cut : maxLength;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

type PdfTextItem = { str: string; transform?: number[] };

function isTextItem(item: unknown): item is PdfTextItem {
  return Boolean(item && typeof item === "object" && "str" in item && typeof (item as { str?: unknown }).str === "string");
}

// The file this reader is handed has already been watermarked server-side
// (see lib/watermarkPdf.ts): a faint label repeated about a dozen times per
// page. Those are real text objects, not part of the picture, so the voice
// was reading the site address over and over between sentences.
//
// Two filters clear it without the browser needing to know what the label
// says. The watermark is drawn on a 35-degree slant while body text sits
// upright, and anything long enough to be a phrase that repeats verbatim
// several times on one page is page furniture - a stamp, a running header -
// rather than something a person wants read to them. Short repeats are left
// alone: ordinary words legitimately appear many times on a page.
function readableText(items: unknown[]) {
  const upright: string[] = [];
  const counts = new Map<string, number>();

  for (const item of items) {
    if (!isTextItem(item)) continue;

    const transform = item.transform;
    if (transform && transform.length >= 4) {
      const [a, b, c, d] = transform;
      const slanted = Math.abs(b) > Math.abs(a) * 0.3 || Math.abs(c) > Math.abs(d) * 0.3;
      if (slanted) continue;
    }

    const text = item.str.trim();
    if (!text) continue;
    upright.push(item.str);
    counts.set(text, (counts.get(text) || 0) + 1);
  }

  return upright
    .filter((raw) => {
      const text = raw.trim();
      return !(text.length >= 12 && (counts.get(text) || 0) >= 3);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    // PDFs lay text out as positioned fragments, so what comes back is
    // "competitors . It" and "E - commerce". Read aloud that becomes a
    // stumble and "E dash commerce"; closing those gaps is the difference
    // between a voice reading sentences and a voice reading fragments.
    .replace(/\s+([.,;:!?%])/g, "$1")
    .replace(/(\w)\s-\s(\w)/g, "$1-$2")
    .replace(/\s+/g, " ")
    .trim();
}

const VOICE_STORAGE_KEY = "prowess:pdf-voice";

// macOS ships a set of joke voices (Bahh, Boing, Zarvox and friends) under
// the same English locale as the real ones. Nobody wants a document read to
// them by Bubbles, and they bury the good voices in the picker.
const NOVELTY_VOICES = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy|princess/i;

// Rough quality order, best last. "Natural"/"Neural"/"Premium"/"Enhanced"
// are what the platforms call their modern voices; Google's Chrome voices
// are synthesised server-side and sound markedly better than the local
// ones; the named entries are the decent stock voices on macOS, Windows
// and Android respectively.
const VOICE_RANK = [/\bdaniel\b|\bkaren\b|\bmoira\b/i, /\bsamantha\b|\bsonia\b|\baria\b|\bjenny\b|\bava\b/i, /\bgoogle\b/i, /enhanced|premium/i, /neural/i, /natural/i];

function scoreVoice(voice: SpeechSynthesisVoice) {
  let score = 0;
  VOICE_RANK.forEach((pattern, index) => {
    if (pattern.test(voice.name)) score = Math.max(score, index + 1);
  });
  // A voice served over the network is nearly always one of the good ones.
  if (!voice.localService) score += 1;
  if (/compact|espeak/i.test(voice.name)) score -= 5;
  return score;
}

function englishVoices(all: SpeechSynthesisVoice[]) {
  return all
    .filter((voice) => voice.lang?.toLowerCase().startsWith("en") && !NOVELTY_VOICES.test(voice.name))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a) || a.name.localeCompare(b.name));
}

function canUseSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// One shared load per page: both the reader and the listen controls need
// the library, and fetching a 400KB module twice helps nobody.
let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = (async () => {
    // Loaded from /public as a native ES module, deliberately hidden from
    // webpack (webpackIgnore). Importing "pdfjs-dist" through the bundler
    // is what kept breaking: with this project's esmExternals interop the
    // import resolved to a wrapper whose GlobalWorkerOptions and
    // getDocument were undefined, so the reader threw before it ever
    // fetched the file -- every PDF fell through to the fallback, and the
    // listen controls went with it since extracting text needs the same
    // library. The browser now loads Mozilla's build exactly as shipped.
    // scripts/copy-pdf-worker.mjs keeps both files in step with the
    // installed pdfjs-dist; pdf.js refuses to run a worker whose version
    // does not match the API that loaded it.
    const specifier = "/pdfjs/pdf.min.mjs";
    const mod = await import(/* webpackIgnore: true */ specifier);
    const pdfjs = ((mod as { default?: PdfJsModule }).default ?? mod) as PdfJsModule;
    if (!pdfjs?.GlobalWorkerOptions || typeof pdfjs.getDocument !== "function") {
      throw new Error("pdf.js loaded but did not expose getDocument/GlobalWorkerOptions");
    }
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    return pdfjs;
  })();

  // A failed load must not be cached, or the retry on the next render (or
  // the first press of Play) replays the same rejection forever.
  pdfjsPromise.catch(() => {
    pdfjsPromise = null;
  });

  return pdfjsPromise;
}

function PdfPageCanvas({
  pdf,
  pageNumber,
  renderWidth,
  onMount,
  isSpoken,
}: {
  pdf: PdfDocumentProxy;
  pageNumber: number;
  renderWidth: number;
  onMount: (pageNumber: number, node: HTMLDivElement | null) => void;
  isSpoken: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Rendering every page of a 60-page PDF up front froze the tab and left
  // a tall stack of blank canvases behind it. Only pages at (or near) the
  // reader's scroll position get rasterised; the rest hold their place
  // with an A4-shaped placeholder so nothing jumps as you scroll, and so
  // jumping straight to page 40 lands in the right place.
  const [visible, setVisible] = useState(pageNumber <= 2);
  const [rendered, setRendered] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const setWrapper = useCallback(
    (node: HTMLDivElement | null) => {
      wrapperRef.current = node;
      onMount(pageNumber, node);
    },
    [onMount, pageNumber]
  );

  useEffect(() => {
    if (visible) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!visible || !canvasRef.current || renderWidth <= 0) return;
      setRenderFailed(false);
      try {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = renderWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context || cancelled) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setRendered(true);
      } catch (error) {
        console.error(`[PdfViewer] Could not render page ${pageNumber}`, error);
        if (!cancelled) setRenderFailed(true);
      }
    }

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, renderWidth, visible]);

  return (
    <div ref={setWrapper} data-page={pageNumber} className="flex flex-col items-center px-3 py-4">
      {renderFailed ? (
        <div className="flex min-h-40 w-full items-center justify-center rounded-lg bg-muted px-4 text-center text-sm text-muted-foreground">
          Page {pageNumber} could not be shown.
        </div>
      ) : (
        <div
          className={`relative overflow-hidden rounded-sm bg-background shadow-sm ring-1 transition-shadow ${isSpoken ? "ring-2 ring-primary" : "ring-border"}`}
          style={{ width: renderWidth }}
        >
          {!rendered && <div className="w-full bg-muted" style={{ aspectRatio: "1 / 1.414" }} aria-hidden="true" />}
          <canvas ref={canvasRef} className={rendered ? "block h-auto w-full" : "sr-only"} aria-label={`Page ${pageNumber}`} />
        </div>
      )}
      <p className="mt-2 text-xs font-medium text-muted-foreground">Page {pageNumber}</p>
    </div>
  );
}

export function PdfViewer({ url, title, contents = [] }: { url: string; title: string; contents?: ContentsEntry[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const pageNodesRef = useRef(new Map<number, HTMLDivElement>());
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  const chunksRef = useRef<SpeechChunk[]>([]);
  const speechIndexRef = useRef(0);
  const stoppedRef = useRef(false);
  // Every utterance carries the token it was started with. speechSynthesis
  // fires end/error on an utterance that gets cancelled, so without this a
  // voice or speed change - which cancels the current piece and starts a
  // new one - had the cancelled piece's handler fire straight afterwards
  // and advance past the piece that had only just begun, silently skipping
  // a chunk of the document.
  const speechTokenRef = useRef(0);
  // The page the voice is on, tracked outside state so the decision to
  // scroll is made in the function itself rather than inside a state
  // updater, which React is free to run more than once.
  const spokenPageRef = useRef<number | null>(null);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const [baseWidth, setBaseWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [failed, setFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [speechError, setSpeechError] = useState("");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [spokenPage, setSpokenPage] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [contentsOpen, setContentsOpen] = useState(false);

  const isListening = speechState === "playing" || speechState === "paused";

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // getVoices() is empty on first call in most browsers and fills in
  // asynchronously, so the list has to be read again on voiceschanged.
  // Choosing the default happens here too: browsers otherwise hand out the
  // first voice in their own list, which is routinely the most robotic one
  // installed.
  useEffect(() => {
    if (!canUseSpeech()) return;

    function loadVoices() {
      const available = englishVoices(window.speechSynthesis.getVoices());
      if (available.length === 0) return;
      setVoices(available);

      const current = voiceRef.current;
      if (current && available.some((voice) => voice.voiceURI === current.voiceURI)) return;

      let saved: string | null = null;
      try {
        saved = window.localStorage.getItem(VOICE_STORAGE_KEY);
      } catch {
        saved = null;
      }
      const chosen = available.find((voice) => voice.voiceURI === saved) || available[0];
      voiceRef.current = chosen;
      setVoiceUri(chosen.voiceURI);
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const registerPage = useCallback((pageNumber: number, node: HTMLDivElement | null) => {
    if (node) pageNodesRef.current.set(pageNumber, node);
    else pageNodesRef.current.delete(pageNumber);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setFailed(false);
      setPdfDocument(null);
      setNumPages(null);
      try {
        const pdfjs = await loadPdfJs();
        if (cancelled) return;
        pdfjsRef.current = pdfjs;
        const loaded = await pdfjs.getDocument(url).promise;
        if (cancelled) return;
        setPdfDocument(loaded);
        setNumPages(loaded.numPages);
      } catch (error) {
        console.error("[PdfViewer] Could not open document", error);
        if (!cancelled) setFailed(true);
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (canUseSpeech()) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBaseWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Chrome quietly stops long-running synthesis even when the utterances
  // themselves are short, especially once the tab loses focus. resume() is
  // a no-op while speech is genuinely running, so calling it on a timer
  // costs nothing and revives the cases where it has silently died.
  useEffect(() => {
    if (speechState !== "playing" || !canUseSpeech()) return;
    const timer = window.setInterval(() => window.speechSynthesis.resume(), 5000);
    return () => window.clearInterval(timer);
  }, [speechState]);

  const scrollToPage = useCallback((pageNumber: number, smooth = true) => {
    const container = scrollRef.current;
    const node = pageNodesRef.current.get(pageNumber);
    if (!container || !node) return;
    container.scrollTo({ top: node.offsetTop, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Which page is the reader actually looking at: the one whose top edge is
  // nearest the top of the scroll area. Drives the page counter, and stops
  // the counter and the follow-along from disagreeing.
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    let nearest = 1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    pageNodesRef.current.forEach((node, pageNumber) => {
      const distance = Math.abs(node.offsetTop - container.scrollTop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = pageNumber;
      }
    });
    setCurrentPage(nearest);
  }, []);

  async function extractPdfPages() {
    const pdfjs = pdfjsRef.current || (await loadPdfJs());
    pdfjsRef.current = pdfjs;
    const pdf = pdfDocument || (await pdfjs.getDocument(url).promise);
    const pages: { page: number; text: string }[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = readableText(textContent.items);
      if (pageText) pages.push({ page: pageNumber, text: pageText });
    }

    return pages;
  }

  // A plain function, not a useCallback: it calls itself to advance to the
  // next chunk, and nothing depends on its identity.
  function speakFrom(index: number) {
      if (!canUseSpeech() || chunksRef.current.length === 0) return;
      const chunk = chunksRef.current[index];
      if (!chunk) return;

      const synth = window.speechSynthesis;
      const token = ++speechTokenRef.current;
      synth.cancel();
      stoppedRef.current = false;
      speechIndexRef.current = index;
      setProgress((index + 1) / chunksRef.current.length);

      // The document follows the voice. Only when the spoken page actually
      // changes, so a page that takes six chunks to read is not yanked back
      // to its own top six times over.
      if (spokenPageRef.current !== chunk.page) {
        spokenPageRef.current = chunk.page;
        scrollToPage(chunk.page);
      }
      setSpokenPage(chunk.page);

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.rate = rateRef.current;
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
        utterance.lang = voiceRef.current.lang;
      }
      utterance.onend = () => {
        if (stoppedRef.current || token !== speechTokenRef.current) return;
        const next = speechIndexRef.current + 1;
        if (next < chunksRef.current.length) {
          speakFrom(next);
        } else {
          setSpeechState("idle");
          setSpokenPage(null);
          spokenPageRef.current = null;
          setProgress(0);
          speechIndexRef.current = 0;
        }
      };
      utterance.onerror = () => {
        if (stoppedRef.current || token !== speechTokenRef.current) return;
        setSpeechState("idle");
        setSpeechError("Audio reading stopped. Press play to continue.");
      };
      setSpeechState("playing");
      synth.speak(utterance);
  }

  async function startSpeech() {
    if (!canUseSpeech()) {
      setSpeechState("unavailable");
      setSpeechError("Audio reading is not supported in this browser.");
      return;
    }

    setSpeechError("");
    if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("playing");
      return;
    }

    if (chunksRef.current.length === 0) {
      setSpeechState("extracting");
      try {
        const pages = await extractPdfPages();
        const chunks: SpeechChunk[] = [];
        for (const page of pages) {
          for (const text of chunkText(page.text)) chunks.push({ text, page: page.page });
        }
        if (chunks.length === 0) {
          setSpeechState("unavailable");
          setSpeechError("This PDF has no readable text. It may be a scanned document.");
          return;
        }
        chunksRef.current = chunks;
        // Start from whatever page the reader is on rather than always
        // from page one - somebody who scrolled to page 5 and pressed play
        // means "read this".
        const startAt = chunks.findIndex((chunk) => chunk.page >= currentPage);
        speakFrom(startAt >= 0 ? startAt : 0);
      } catch (error) {
        console.error("[PdfViewer] Could not extract text for audio", error);
        setSpeechState("idle");
        setSpeechError("Could not prepare audio reading for this PDF.");
      }
      return;
    }

    speakFrom(speechIndexRef.current);
  }

  function pauseSpeech() {
    if (!canUseSpeech()) return;
    window.speechSynthesis.pause();
    setSpeechState("paused");
  }

  function stopSpeech() {
    if (!canUseSpeech()) return;
    stoppedRef.current = true;
    speechTokenRef.current += 1;
    window.speechSynthesis.cancel();
    speechIndexRef.current = 0;
    setSpeechState("idle");
    setSpokenPage(null);
    spokenPageRef.current = null;
    setProgress(0);
  }

  function changeRate(value: string) {
    const nextRate = Number(value);
    setRate(nextRate);
    rateRef.current = nextRate;
    // A rate change only takes effect on a new utterance, so the current
    // chunk is restarted at the new speed rather than finishing at the old.
    if (speechState === "playing" && chunksRef.current.length > 0) speakFrom(speechIndexRef.current);
  }

  function changeVoice(nextUri: string) {
    const chosen = voices.find((voice) => voice.voiceURI === nextUri);
    if (!chosen) return;
    voiceRef.current = chosen;
    setVoiceUri(nextUri);
    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, nextUri);
    } catch {
      // A browser with site data blocked just does not remember the choice.
    }
    // Same as a speed change: a voice only applies to a new utterance, so
    // the current piece restarts in the new voice instead of finishing in
    // the old one.
    if (speechState === "playing" && chunksRef.current.length > 0) speakFrom(speechIndexRef.current);
  }

  function goToPage(pageNumber: number) {
    if (!numPages) return;
    const target = Math.min(Math.max(pageNumber, 1), numPages);
    setCurrentPage(target);
    scrollToPage(target);
  }

  async function toggleFullscreen() {
    if (!rootRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current.requestFullscreen();
    } catch (error) {
      console.error("[PdfViewer] Fullscreen not available", error);
    }
  }

  const iconButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

  const listenControls = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <span className="mr-1 hidden items-center gap-2 text-sm font-semibold text-foreground lg:flex">
        <Headphones size={16} className="text-primary" aria-hidden="true" />
        Listen
      </span>
      {speechState === "playing" ? (
        <button type="button" onClick={pauseSpeech} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Pause size={15} aria-hidden="true" />
          Pause
        </button>
      ) : (
        <button
          type="button"
          onClick={startSpeech}
          disabled={speechState === "extracting"}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Play size={15} aria-hidden="true" />
          {speechState === "extracting" ? "Preparing" : speechState === "paused" ? "Resume" : "Play"}
        </button>
      )}
      <button
        type="button"
        onClick={stopSpeech}
        disabled={!isListening}
        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Square size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Stop</span>
      </button>
      {voices.length > 1 && (
        <label className="flex min-h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-sm font-semibold text-foreground lg:max-w-44 lg:flex-none">
          <span className="sr-only">Reading voice</span>
          <select value={voiceUri} onChange={(e) => changeVoice(e.target.value)} className="w-full truncate bg-transparent text-sm focus-visible:outline-none">
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex min-h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-sm font-semibold text-foreground">
        <span className="sr-only">Reading speed</span>
        <select value={rate} onChange={(e) => changeRate(e.target.value)} className="bg-transparent text-sm focus-visible:outline-none">
          <option value={0.85}>0.85x</option>
          <option value={1}>1x</option>
          <option value={1.15}>1.15x</option>
          <option value={1.3}>1.3x</option>
          <option value={1.5}>1.5x</option>
        </select>
      </label>
    </div>
  );

  if (failed) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-3">{listenControls}</div>
        {speechError && <p className="border-b border-border px-3 py-2 text-sm font-medium text-destructive">{speechError}</p>}
        {/* Desktop browsers ship a PDF viewer an iframe can use, so there
            the document just appears and the note stays out of the way.
            Mobile browsers and the installed PWA mostly render a blank box
            instead - that was the "does not work on mobile" - so below lg
            the iframe is not rendered at all and the button, which hands
            the file to the phone's own viewer, is the whole answer. */}
        <div className="hidden lg:block">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">Showing this document in your browser&apos;s reader.</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Open in a new tab
            </a>
          </div>
          <iframe src={url} title={title} className="h-[70vh] w-full border-t border-border bg-background" />
        </div>
        <div className="p-6 text-center lg:hidden">
          <p className="text-sm font-bold text-foreground">Open the document</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            This opens in your phone&apos;s own PDF reader. The listen controls above work here too.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Open PDF
          </a>
        </div>
        <p className="sr-only">{title}</p>
      </div>
    );
  }

  const renderWidth = Math.max(Math.round((baseWidth - PAGE_GUTTER) * zoom), 0);

  return (
    <div ref={rootRef} className="overflow-hidden rounded-lg border border-border bg-card">
      {/* In normal flow, never floating over the document: an overlaid
          toolbar covers the top of every page it sits on. Two deliberate
          rows on a phone -- document controls, then listening -- instead of
          one row of ten controls wrapping wherever it runs out of width,
          which is what made this look thrown together on mobile. */}
      <div className="border-b border-border bg-card lg:flex lg:items-center lg:justify-between lg:gap-4 lg:px-3 lg:py-2">
        <div className="flex items-center justify-between gap-1 px-2.5 py-2 sm:gap-1.5 lg:px-0 lg:py-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {contents.length > 0 && (
              <button
                type="button"
                onClick={() => setContentsOpen((open) => !open)}
                aria-expanded={contentsOpen}
                className={`${iconButton} ${contentsOpen ? "bg-primary/10 text-primary" : ""}`}
                aria-label={contentsOpen ? "Hide contents" : "Show contents"}
              >
                {contentsOpen ? <X size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
              </button>
            )}
            <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className={iconButton} aria-label="Previous page">
              <ChevronUp size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={!numPages || currentPage >= numPages} className={iconButton} aria-label="Next page">
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <label className="sr-only" htmlFor="pdf-page-input">Page number</label>
              <input
                id="pdf-page-input"
                type="number"
                min={1}
                max={numPages || 1}
                value={currentPage}
                onChange={(e) => {
                  if (!e.target.value) return;
                  goToPage(Number(e.target.value));
                }}
                className="h-9 w-11 rounded-lg border border-border bg-background px-1 text-center text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-14 sm:px-2"
              />
              <span className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">/ {numPages ?? "-"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button type="button" onClick={() => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))} disabled={zoom <= MIN_ZOOM} className={iconButton} aria-label="Zoom out">
              <ZoomOut size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setZoom(1)} className="inline-flex h-9 min-w-12 items-center justify-center rounded-lg border border-border bg-background px-1.5 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-16 sm:px-2 sm:text-sm">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))} disabled={zoom >= MAX_ZOOM} className={iconButton} aria-label="Zoom in">
              <ZoomIn size={16} aria-hidden="true" />
            </button>
            <button type="button" onClick={toggleFullscreen} className={`${iconButton} hidden sm:inline-flex`} aria-label={isFullscreen ? "Exit full screen" : "Full screen"}>
              {isFullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-t border-border px-2.5 py-2 lg:border-t-0 lg:px-0 lg:py-0">
          {listenControls}
        </div>
      </div>

      {/* The admin's own contents list. Entries that name a page jump to it;
          entries that don't are still worth showing, so somebody can see
          what is in the document before deciding to read it. */}
      {contentsOpen && contents.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-b border-border bg-muted px-2.5 py-2">
          <p className="px-2 pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Contents</p>
          <ol>
            {contents.map((entry, index) => (
              <li key={`${entry.label}-${index}`}>
                {entry.page !== null ? (
                  <button
                    type="button"
                    onClick={() => {
                      goToPage(entry.page!);
                      setContentsOpen(false);
                    }}
                    className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left text-sm font-medium text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>{entry.label}</span>
                    <span className="flex-shrink-0 text-xs font-semibold text-muted-foreground">p. {entry.page}</span>
                  </button>
                ) : (
                  <p className="px-2 py-2 text-sm text-muted-foreground">{entry.label}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Only while listening: how far through the document the voice is,
          so a reader who looks away knows it is still going. */}
      {isListening && (
        <div className="flex items-center gap-3 border-b border-border bg-muted px-3 py-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
            {speechState === "paused" ? "Paused" : "Reading"} page {spokenPage ?? currentPage}
          </p>
        </div>
      )}

      {speechError && <p className="border-b border-border px-3 py-2 text-sm font-medium text-destructive">{speechError}</p>}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        tabIndex={0}
        className={`relative overflow-auto overscroll-contain bg-muted focus-visible:outline-none ${isFullscreen ? "h-[calc(100vh-7rem)]" : "h-[75vh] min-h-[420px]"}`}
      >
        {/* Zero-height probe: measures the reader's own content width so
            100% zoom means "fits the width", independent of the zoomed
            pages, which are allowed to overflow and scroll sideways. */}
        <div ref={measureRef} className="h-0" aria-hidden="true" />
        {!pdfDocument ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">Loading document...</div>
        ) : renderWidth > 0 && numPages ? (
          Array.from({ length: numPages }, (_, i) => (
            <PdfPageCanvas
              key={i}
              pdf={pdfDocument}
              pageNumber={i + 1}
              renderWidth={renderWidth}
              onMount={registerPage}
              isSpoken={spokenPage === i + 1}
            />
          ))
        ) : null}
      </div>
      <p className="sr-only">{title}</p>
    </div>
  );
}
