import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import "./styles/theme.css";

// Polyfill URL.parse — didukung mulai Chrome 126, Safari 18, Firefox 126
// react-pdf versi baru memakainya, browser lama akan crash tanpa ini
if (typeof URL.parse !== "function") {
  (URL as any).parse = (url: string, base?: string): URL | null => {
    try { return new URL(url, base); } catch { return null; }
  };
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    