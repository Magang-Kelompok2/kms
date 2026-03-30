# Taxacore

A React + TypeScript + Vite dashboard template with Tailwind v4, Radix UI components, and client-side routing.

## Prerequisites

- Node.js 18 or newer
- npm 10 or newer

## Setup

1. Buka folder proyek:

```bash
cd taxacore
```

2. Install dependency:

```bash
npm install
```

## Available scripts

- `npm run dev` - Jalankan development server dengan hot reload
- `npm run build` - Build aplikasi untuk produksi
- `npm run preview` - Preview bundle hasil build
- `npm run lint` - Jalankan pemeriksaan ESLint

## Start development

```bash
npm run dev
```

Lalu buka browser di `http://localhost:5173`.

## Build production

```bash
npm run build
```

Jika build berhasil, file output akan ada di folder `dist/`.

## Preview hasil build

```bash
npm run preview
```

## Struktur proyek utama

- `src/main.tsx` - Entrypoint React
- `src/app/App.tsx` - Root aplikasi dan provider
- `src/app/routes.tsx` - Router aplikasi
- `src/app/context/AuthContext.tsx` - Autentikasi demo
- `src/app/pages/` - Halaman aplikasi
- `src/app/components/` - Komponen UI, termasuk komponen dashboard
- `src/app/components/ui/` - Komponen UI generik
- `src/styles/` - File CSS dan konfigurasi Tailwind

## Keterangan tambahan

- Menggunakan `react-router-dom` untuk routing
- Menggunakan Tailwind CSS v4 melalui plugin `@tailwindcss/vite`
- Menggunakan `lucide-react` untuk ikon
- Menggunakan `radix-ui` untuk komponen UI interaktif

## Troubleshooting

Jika muncul error saat `npm install` atau `npm run dev`:

1. Pastikan Node.js versi terbaru
2. Hapus `node_modules` dan `package-lock.json`
3. Jalankan ulang:

```bash
rm -rf node_modules package-lock.json
npm install
```

Jika kamu menggunakan Windows PowerShell, gunakan:

```powershell
Remove-Item -Recurse -Force node_modules,package-lock.json
npm install
```
