import { useState } from "react";
import { Button } from "./ui/button";
import { FileText, Eye } from "lucide-react";

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [showPDF, setShowPDF] = useState(false);

  // For demo purposes, we'll use a mock PDF viewer
  // In production, this would use Google Docs Viewer or similar
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="space-y-4">
      {!showPDF ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <FileText className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4 font-semibold">
            Dokumen PDF
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Klik tombol di bawah untuk melihat dokumen PDF
          </p>
          <Button onClick={() => setShowPDF(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Lihat PDF
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">Tampilan PDF (View Only)</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowPDF(false)}>
              Tutup
            </Button>
          </div>

          {/* PDF Preview using iframe */}
          <div className="bg-gray-900 rounded-lg overflow-hidden border-4 border-gray-200 dark:border-gray-700">
            <div className="relative w-full h-[600px] bg-white">
              {/* Mock PDF Content */}
              <div className="absolute inset-0 flex flex-col">
                <div className="bg-gray-200 p-2 border-b border-gray-300 flex items-center justify-between">
                  <span className="text-xs text-gray-600">PDF Viewer (View Only - No Download)</span>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-white">
                  {/* Mock PDF Page */}
                  <div className="max-w-3xl mx-auto bg-white shadow-lg p-12 space-y-4">
                    <div className="flex items-center justify-center mb-8">
                      <FileText className="h-12 w-12 text-blue-600 mb-2" />
                    </div>
                    <h1 className="text-2xl font-normal text-center mb-6">
                      Dokumen Materi Pembelajaran
                    </h1>
                    <div className="space-y-4 text-gray-700">
                      <p>
                        Ini adalah tampilan preview dokumen PDF. Dalam implementasi nyata, 
                        dokumen PDF akan ditampilkan di sini dengan konten lengkap.
                      </p>
                      <div className="bg-gray-100 p-4 rounded">
                        <p className="font-semibold mb-2">Catatan:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Dokumen hanya dapat dilihat (view only)</li>
                          <li>Tidak ada fitur download</li>
                          <li>Konten dilindungi untuk keamanan</li>
                        </ul>
                      </div>
                      <p>
                        Materi pembelajaran ini dirancang untuk membantu Anda memahami 
                        konsep-konsep penting dalam mata kuliah.
                      </p>
                      <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50">
                        <p className="text-sm">
                          <strong>Tips:</strong> Baca materi dengan seksama dan catat 
                          poin-poin penting untuk persiapan kuis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>📄 Dokumen ini hanya untuk dilihat dan tidak dapat diunduh</p>
          </div>
        </div>
      )}
    </div>
  );
}