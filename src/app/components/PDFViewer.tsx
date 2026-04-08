import { useState, useCallback, useRef, type WheelEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "./ui/button";
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
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
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
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

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3.5;
  const ZOOM_STEP = 0.1;

  const normalizeScale = (value: number) =>
    Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value * 10) / 10));

  const handleZoomIn = () => setScale((s) => normalizeScale(s + ZOOM_STEP));
  const handleZoomOut = () => setScale((s) => normalizeScale(s - ZOOM_STEP));
  const handleResetZoom = () => setScale(1.0);

  const handleWheelZoom = (event: WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        // Scroll horizontal
        event.currentTarget.scrollLeft += event.deltaX;
      }
      return;
    }
    event.preventDefault();

    const delta = Math.sign(-event.deltaY) * ZOOM_STEP;
    setScale((s) => normalizeScale(s + delta));
  };

  return (
    <div ref={viewerRef} className="h-full flex flex-col space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Tampilan PDF (View Only)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {(scale * 100).toFixed(0)}%
          </span>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetZoom}>
            Reset
          </Button>
          <Button size="sm" variant="outline" onClick={handleFullscreen}>
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          {numPages > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Memuat dokumen...</p>
            </div>
          </div>
        )}

        {loadError && (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <FileText className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-500 font-medium">
                Gagal memuat dokumen
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Pastikan file PDF tersedia dan dapat diakses
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setIsLoading(true);
                  setLoadError(false);
                }}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        )}

        {!loadError && (
          <div
            className="overflow-x-auto overflow-y-auto scrollbar-visible"
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheelZoom}
            style={{
              touchAction: "pan-x pan-y pinch-zoom",
              overscrollBehavior: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "auto",
            }}
          >
            <div className="inline-block min-w-max mx-auto">
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  className="shadow-lg"
                  scale={scale}
                />
              </Document>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 shrink-0">
        📄 Dokumen ini hanya untuk dilihat dan tidak dapat diunduh
      </p>
    </div>
  );
}
