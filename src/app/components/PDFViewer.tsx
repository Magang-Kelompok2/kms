import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "./ui/button";
import {
  FileText,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
  const [showPDF, setShowPDF] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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

  const handleOpen = () => {
    setShowPDF(true);
    setIsLoading(true);
    setLoadError(false);
    setPageNumber(1);
  };

  const handleClose = () => {
    setShowPDF(false);
    setIsLoading(true);
    setLoadError(false);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {!showPDF ? (
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold text-lg">
              Dokumen PDF
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Klik tombol di bawah untuk melihat dokumen
            </p>
            <Button onClick={handleOpen}>
              <Eye className="h-4 w-4 mr-2" />
              Lihat PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">
                Tampilan PDF (View Only)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Pagination */}
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
              <Button size="sm" variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-1" />
                Tutup
              </Button>
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
                    onClick={handleOpen}
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            )}

            {!loadError && (
              <div
                className="flex justify-center p-4"
                onContextMenu={(e) => e.preventDefault()}
              >
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
                    width={Math.min(window.innerWidth * 0.6, 900)}
                  />
                </Document>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 shrink-0">
            📄 Dokumen ini hanya untuk dilihat dan tidak dapat diunduh
          </p>
        </div>
      )}
    </div>
  );
}
