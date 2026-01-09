import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' allows loading all environment variables including those without VITE_ prefix.
  // @ts-ignore - process.cwd is available in the Node.js environment where this config runs
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // These will be replaced with actual values during build time on Netlify
      // Ensure you set API_KEY and GOOGLE_CLIENT_ID in Netlify Site Settings
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID)
    }
  };
});