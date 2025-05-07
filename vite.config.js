import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
    })
  ],

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'src/index.html')
      },
    },
  },
});