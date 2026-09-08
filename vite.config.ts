import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { mflLive } from "./vite/mfl-live.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), mflLive()],
  server: {
    // Bare loopback. Dette er en personlig app med karakterene dine i seg,
    // og med 0.0.0.0 kunne hvem som helst på samme nett lese dem.
    // Trenger du den på telefonen: start med --host, og les avsnittet
    // om tilgang i README først.
    host: "127.0.0.1",
    port: 43147,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 43147,
  },
});
