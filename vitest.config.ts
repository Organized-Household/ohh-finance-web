import path from "path";
import { defineConfig } from "vitest/config";

// Maps the "@/" import alias (tsconfig paths) for vitest — without this any
// test that imports app code using "@/..." fails to load.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
