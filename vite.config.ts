import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Expand prefix to empty string to load all env vars
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Loaded environment variables for Supabase:');
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.log('VITE_API_URL:', env.VITE_API_URL ? 'Set' : 'Not set');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: undefined,
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return `assets/[name].[hash][extname]`;
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name].[hash][extname]`;
            }
            return `assets/[name].[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js'
        }
      },
      assetsInlineLimit: 0,
      modulePreload: {
        polyfill: false
      },
      sourcemap: false,
      minify: 'terser'
    },
    // Define environment variables
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3001')
    },
    envPrefix: ['VITE_'],
  };
});
