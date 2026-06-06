import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: "index.html",
      output: {
        inlineDynamicImports: true,
        entryFileNames: "app.js",
        chunkFileNames: "app.js",
      },
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['/'],
    },
  },
});
