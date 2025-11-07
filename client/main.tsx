import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";

declare global {
  interface Window { __MEMBIT_REACT_ROOT__?: Root }
}

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

// Normalize global errors/unhandled rejections to avoid malformed payloads reaching Vite overlay
(function installGlobalErrorHandlers() {
  try {
    window.addEventListener('error', (ev: ErrorEvent) => {
      try {
        const err = ev.error;
        if (err && typeof err === 'object') {
          if (!('stack' in err) || !err.stack) {
            try {
              (err as any).stack = `${err.name ?? 'Error'}: ${err.message ?? String(err)}`;
            } catch (_) {
              (err as any).stack = String(err);
            }
          }
        }
      } catch (e) {
        // swallow
      }
    });

    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      try {
        let r: any = ev.reason;
        if (r && typeof r === 'object' && !(r instanceof Error)) {
          const msg = r?.message ?? JSON.stringify(r);
          const e = new Error(msg);
          // copy basics
          try { e.name = r.name ?? e.name; } catch {}
          try { (ev as any).reason = e; } catch {}
        }
      } catch (e) {
        // swallow
      }
    });
  } catch (e) {
    // ignore
  }
})();

// Reuse existing root if HMR or module re-evaluation happens
let root = window.__MEMBIT_REACT_ROOT__;
if (!root) {
  root = createRoot(container);
  window.__MEMBIT_REACT_ROOT__ = root;
}

root.render(<App />);

// Accept HMR updates for React components gracefully
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept();
}
