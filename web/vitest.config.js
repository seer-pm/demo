import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    globals: true
  },
})