import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "./ui/button";
import {
  FileText,
  Loader2,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Wajib set worker agar react-pdf bisa render
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [fitWidth, setFitWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Resize Observer to handle fit-to-width
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      // Subtracting some padding for aesthetics
      setContainerWidth(width - 48); 
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setLoadError(false);
    },
    [],
  );

  const onDocumentLoadError = useCallback(() => {
    setIsLoading(false);
    setLoadError(true);
  }, []);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      viewerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleZoomIn = () => {
    setFitWidth(false);
    setScale((s) => Math.min(s + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setFitWidth(false);
    setScale((s) => Math.max(s - 0.2, 0.5));
  };

  const handleToggleFitWidth = () => {
    setFitWidth(!fitWidth);
    if (!fitWidth) setScale(1.0);
  };

  // Ctrl+Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setFitWidth(false);
      setScale((s) => Math.min(Math.max(s - e.deltaY * 0.005, 0.5), 3.0));
    }
  }, []);

  return (
    <div ref={viewerRef} onWheel={handleWheel} className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border border-border">
      {/* ── Enhanced Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-border select-none shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              PDF Viewer
            </h4>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              Mode: {fitWidth ? "Fit Width" : `Zoom ${Math.round(scale * 100)}%`} • {numPages} Halaman
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 shadow-none"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={handleToggleFitWidth}
            className={`h-8 px-3 text-xs font-medium transition-all ${
              fitWidth 
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700"
            }`}
          >
            {fitWidth ? "Normal" : "Fit Width"}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 shadow-none"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFullscreen}
            className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* ── Scrollable PDF Container ── */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Menyiapkan dokumen...</p>
          </div>
        )}

        {loadError && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Gagal Memuat PDF</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Terjadi masalah saat mengambil file. Pastikan koneksi internet stabil.
            </p>
            <Button
              variant="outline"
              className="mt-6 gap-2"
              onClick={() => {
                setIsLoading(true);
                setLoadError(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Muat Ulang
            </Button>
          </div>
        )}

        {!loadError && (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <div 
                key={`page_container_${index + 1}`}
                className="mb-8 w-full flex justify-center last:mb-0"
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-sm overflow-hidden bg-white"
                  width={fitWidth ? containerWidth : undefined}
                  scale={fitWidth ? 1.0 : scale}
                />
              </div>
            ))}
          </Document>
        )}
      </div>

      {/* Footer / Info */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-border flex justify-between items-center shrink-0">
        <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5 uppercase tracking-tighter">
          <div className="w-1 h-1 rounded-full bg-green-500" />
          Secure Viewer • Read Only
        </span>
        <p className="text-[11px] text-gray-400 italic">
          Gunakan mouse wheel untuk scroll halaman
        </p>
      </div>
    </div>
  );
}
