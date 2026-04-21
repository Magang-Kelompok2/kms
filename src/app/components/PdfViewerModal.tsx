import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  FileText,
  Loader2,
} from "lucide-react";

// Set up PDF.js worker (pdfjs-dist ships with react-pdf v10)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PdfViewerModal({
  url,
  fileName,
  onClose,
}: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if ((e.key === "+" || e.key === "=") && !e.ctrlKey) setScale((s) => Math.min(s + 0.2, 4));
      if (e.key === "-" && !e.ctrlKey) setScale((s) => Math.max(s - 0.2, 0.4));
      if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [numPages, pageNumber]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Ctrl+Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((s) => Math.min(Math.max(s - e.deltaY * 0.005, 0.4), 4));
    }
  }, []);

  const goNext = () => setPageNumber((p) => Math.min(p + 1, numPages));
  const goPrev = () => setPageNumber((p) => Math.max(p - 1, 1));
  const resetView = () => { setScale(1.2); setPanOffset({ x: 0, y: 0 }); };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Mouse drag for pan
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: panOffset.x, py: panOffset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    setPanOffset({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
  };
  const onMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#1a1a2e]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Toolbar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2.5 select-none"
        style={{ background: "linear-gradient(135deg,#1e1e3a 0%,#16213e 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Left: file info */}
        <div className="flex items-center gap-2.5 min-w-0 mr-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <FileText className="h-4 w-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-[280px]">{fileName}</p>
            {numPages > 0 && (
              <p className="text-[11px] text-gray-400">{numPages} halaman</p>
            )}
          </div>
        </div>

        {/* Center: page navigation + zoom */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Page nav */}
          <button
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Halaman sebelumnya (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-200"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <input
              type="number"
              value={pageNumber}
              min={1}
              max={numPages || 1}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1 && v <= numPages) setPageNumber(v);
              }}
              className="w-8 text-center bg-transparent outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{numPages || "–"}</span>
          </div>

          <button
            onClick={goNext}
            disabled={pageNumber >= numPages}
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Halaman berikutnya (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* Zoom */}
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Perkecil (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={resetView}
            className="px-2.5 py-1 rounded-md text-xs font-mono text-gray-300 hover:text-white hover:bg-white/10 transition-all min-w-[3.5rem] text-center"
            title="Reset zoom (0)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 4))}
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Perbesar (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          {/* Reset */}
          <button
            onClick={resetView}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Reset tampilan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title={isFullscreen ? "Keluar fullscreen" : "Fullscreen (F11)"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 transition-all hover:text-white"
            style={{}}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            title="Tutup (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── PDF Canvas Area ── */}
      <div
        className="flex-1 overflow-auto relative"
        style={{
          background: "radial-gradient(ellipse at center, #1e2033 0%, #12121e 100%)",
          cursor: isDragging ? "grabbing" : scale > 1.5 ? "grab" : "default",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={handleWheel}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
            <p className="text-sm text-gray-400">Memuat PDF...</p>
          </div>
        )}

        {/* Error state */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-center max-w-sm p-8 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FileText className="h-12 w-12 text-red-400 mx-auto mb-3 opacity-60" />
              <p className="text-white font-medium mb-1">Gagal memuat PDF</p>
              <p className="text-gray-400 text-sm">{loadError}</p>
            </div>
          </div>
        )}

        {/* PDF Document */}
        <div
          className="flex justify-center py-6 px-4"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isDragging ? "none" : "transform 0.15s ease",
            userSelect: "none",
          }}
        >
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setIsLoading(false);
              setLoadError(null);
            }}
            onLoadError={(err) => {
              setIsLoading(false);
              setLoadError(err.message || "File tidak dapat dibaca");
            }}
            loading={null}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={true}
              renderTextLayer={true}
              className="shadow-2xl rounded-sm overflow-hidden"
              onRenderSuccess={() => setIsLoading(false)}
            />
          </Document>
        </div>
      </div>

      {/* ── Bottom hint bar ── */}
      <div
        className="shrink-0 flex items-center justify-center gap-6 py-2 text-[11px] text-gray-600 select-none"
        style={{ background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span>← → : ganti halaman</span>
        <span>+/- : zoom</span>
        <span>Ctrl + Scroll: zoom</span>
        <span>Drag: geser</span>
        <span>Esc: tutup</span>
      </div>
    </div>
  );
}
