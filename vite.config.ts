import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { mflLive } from "./vite/mfl-live.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), mflLive()],
  server: {
    host: "0.0.0.0",
    port: 43147,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 43147,
  },
});
