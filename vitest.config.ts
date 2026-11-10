import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_API_BASE_URL: 'http://api.test/api/v1',
      VITE_MAX_ADVANCE_DAYS: '60',
    },
    coverage: { provider: 'v8', include: ['src/lib/**', 'src/features/**'] },
  },
})
