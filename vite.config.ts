/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), legacy()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
    "import.meta.env.VITE_APP_RELEASE_NOTES": JSON.stringify(pkg.releaseNotes ?? ""),
    "import.meta.env.VITE_APP_ABOUT_FOOTER": JSON.stringify(pkg.aboutFooter ?? ""),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
