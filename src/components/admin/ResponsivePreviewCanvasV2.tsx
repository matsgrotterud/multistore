"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { parseStoreFactoryV2PreviewUrl } from "@/lib/store-factory-v2/preview-query";

export type ReferencePreviewViewportV2 = 375 | 768 | 1440;

export interface ResponsivePreviewCanvasV2Props {
  viewport: ReferencePreviewViewportV2;
  previewUrl: string;
  previewTitle: string;
}

export function isSafeResponsivePreviewUrlV2(value: string): boolean {
  return parseStoreFactoryV2PreviewUrl(value) !== null;
}

/**
 * Keeps a fixed design viewport inside the admin column. Fit mode scales the
 * canvas rather than widening the document; inspect mode contains horizontal
 * scrolling locally. Fullscreen uses the same DOM and state.
 */
export function ResponsivePreviewCanvasV2({
  viewport,
  previewUrl,
  previewTitle,
}: ResponsivePreviewCanvasV2Props) {
  const previewUrlIsSafe = isSafeResponsivePreviewUrlV2(previewUrl);
  const frameRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(true);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [fullscreenMessage, setFullscreenMessage] = useState("");

  const measure = useCallback(() => {
    const available = Math.max(1, (stageRef.current?.clientWidth ?? viewport) - 24);
    setScale(fit ? Math.min(1, available / viewport) : 1);
    setContentHeight(contentRef.current?.offsetHeight ?? 0);
  }, [fit, viewport]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (stageRef.current) observer.observe(stageRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    setFullscreenSupported(
      Boolean(frameRef.current?.requestFullscreen && document.exitFullscreen)
    );
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === frameRef.current);
      setFullscreenMessage("");
      requestAnimationFrame(measure);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [measure]);

  const toggleFullscreen = async () => {
    if (!fullscreenSupported) {
      setFullscreenMessage("Full screen is unavailable in this browser.");
      return;
    }
    try {
      if (document.fullscreenElement === frameRef.current) {
        await document.exitFullscreen();
      } else {
        await frameRef.current?.requestFullscreen();
      }
    } catch {
      setFullscreenMessage(
        "The browser refused full screen. The contained preview is unchanged."
      );
    }
  };

  if (!previewUrlIsSafe) {
    throw new Error("Responsive preview URL must target the internal V2 frame.");
  }

  return (
    <section
      ref={frameRef}
      aria-label="Responsive storefront preview canvas"
      className={`min-w-0 max-w-full overflow-hidden bg-slate-200 ${
        fullscreen ? "flex h-screen flex-col p-4" : "rounded-xl p-3"
      }`}
      data-preview-canvas="contained"
      data-preview-fullscreen={fullscreen ? "true" : "false"}
    >
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs shadow-sm">
        <p className="min-w-0 truncate font-semibold text-slate-600">
          {viewport}px design viewport · {Math.round(scale * 100)}%
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={fit}
            onClick={() => setFit((current) => !current)}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
          >
            {fit ? "Fit on" : "Inspect 100%"}
          </button>
          <button
            type="button"
            aria-pressed={fullscreen}
            disabled={!fullscreenSupported}
            onClick={() => void toggleFullscreen()}
            className="min-h-11 rounded-lg bg-slate-950 px-3 font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {fullscreenMessage}
      </p>
      <div
        ref={stageRef}
        className={`min-h-0 min-w-0 max-w-full ${
          fullscreen ? "flex-1 overflow-auto" : fit ? "overflow-hidden" : "overflow-x-auto"
        }`}
        data-preview-fit={fit ? "true" : "false"}
        style={fit && contentHeight > 0 ? { height: contentHeight * scale } : undefined}
      >
        <div
          ref={contentRef}
          className="origin-top-left transition-transform duration-200 motion-reduce:transition-none"
          style={{
            width: viewport,
            minWidth: viewport,
            transform: fit ? `scale(${scale})` : undefined,
          }}
          data-preview-viewport={viewport}
          data-preview-scale={scale.toFixed(4)}
        >
          <iframe
            title={`${previewTitle} · ${viewport}px storefront preview`}
            src={previewUrl}
            sandbox="allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
            loading="eager"
            width={viewport}
            height={900}
            className="block h-[900px] w-full border-0 bg-white"
            data-preview-real-viewport="true"
            data-preview-code-policy="authenticated-internal-route"
          />
        </div>
      </div>
    </section>
  );
}
