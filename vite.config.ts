import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3010, // Pakai 3001 supaya tidak bentrok dengan app-magang (3000) dan Backend (4000)
    strictPort: true,
    host: true,
  },
});
