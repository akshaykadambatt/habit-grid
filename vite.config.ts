import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  build: { outDir: mode === "e2e" ? "dist-e2e" : "dist" },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "apple-touch-icon-v2.png"],
      manifest: {
        name: "habit-grid",
        short_name: "habit-grid",
        description: "A quiet place to build consistency.",
        theme_color: "#F7F8F5",
        background_color: "#F7F8F5",
        display: "standalone",
        start_url: "/",
        scope: "/",
        id: "/",
        icons: [
          { src: "/icon-v2-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icon-v2-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-v2-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallbackDenylist: [/^\/__/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: process.env.FIRESTORE_EMULATOR_HOST
      ? []
      : ["tests/firestore.rules.test.ts"],
  },
}));
