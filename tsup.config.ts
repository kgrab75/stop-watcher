import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src/StopWatcher.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
