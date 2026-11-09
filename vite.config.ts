import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"
import { tradeCreditPreview } from "./build/tradeCreditPreview.ts"

export default defineConfig({
  server: { host: "127.0.0.1", port: 5180, strictPort: true },
  plugins: [react(), tailwindcss(), tradeCreditPreview()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
})
