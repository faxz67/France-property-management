import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    })
  ],
  server: {
    host: '192.168.1.109',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    // Optimize build for production
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          utils: ['axios']
        },
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    // Include dependencies for better pre-bundling
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'recharts'
    ],
    exclude: ['lucide-react']
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://192.168.1.109:4002/api'),
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true
  }
});