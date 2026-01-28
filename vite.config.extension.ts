import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Extension build configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, "src/extension/background.ts"),
        content: path.resolve(__dirname, "src/extension/content.ts"),
        popup: path.resolve(__dirname, "src/extension/popup.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        // Ensure content script is self-contained
        manualChunks: undefined,
      },
    },
    // Inline dynamic imports for content script
    target: "esnext",
    minify: "terser",
    terserOptions: {
      format: {
        comments: false,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
