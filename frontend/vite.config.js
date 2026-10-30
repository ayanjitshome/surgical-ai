import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite config for the Surgical AI Hub. Keeps backward compatibility with
// REACT_APP_* env vars (the system contract) by widening the env prefix list,
// and preserves the "build" output dir name so Docker + supervisor configs
// that were tuned for CRA continue to work.
export default defineConfig({
  plugins: [
    react({
      // The repo has JSX inside `.js` files (e.g. src/App.js); tell Vite to
      // transform them too, otherwise the parser rejects JSX in a .js file.
      include: "**/*.{js,jsx,ts,tsx}",
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  envPrefix: ["REACT_APP_", "VITE_"],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/build/**",
        "**/dist/**",
        "**/coverage/**",
        "**/public/**",
      ],
    },
  },
  build: {
    outDir: "build",
    sourcemap: false,
  },
});
