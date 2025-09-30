import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    // Allow requests from Cloudflare Tunnel hostnames
    allowedHosts: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});