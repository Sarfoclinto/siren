import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  base: "./",
  build: {
    outDir: "dist", // Vite renderer output
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@frontend": path.resolve(__dirname, "./src/frontend"),
      "@electron": path.resolve(__dirname, "./src/electron"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
