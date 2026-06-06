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
});
