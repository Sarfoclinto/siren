import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//  { reactCompilerPreset }
// import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  base: "./",
  build: {
    outDir: "build",
  },
  server: {
    port: 5173,
    // strictPort: true,
  },
  resolve: {
    alias: {
      "@frontend": path.resolve(__dirname, "./src/frontend"),
      "@electron": path.resolve(__dirname, "./src/electron"),
    },
  },
});
