// Isolated vitest config for running Engineering/QA's test-matrix.json exec files — kept
// separate from the root vitest.config.ts so this one-off QA harness never gets picked up by
// `npm test`/CI. Run explicitly: `npx vitest run --config Engineering/QA/vitest.config.ts`.
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["Engineering/QA/**/*.exec.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../.."),
    },
  },
});
