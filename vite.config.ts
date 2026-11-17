import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

import { profilePages } from "./build/profilePages.ts"

export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    proxy: { "/api/trade-credit": "http://127.0.0.1:5180" },
  },
  plugins: [
    react(),
    tailwindcss(),
    profilePages(loadEnv(mode, process.cwd(), "")),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
}))
