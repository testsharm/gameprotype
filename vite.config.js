import { defineConfig } from 'vite';

// Relative paths for CrazyGames. The dev preview is served through the Arena
// proxy host, so it must be on the allowed-hosts list.
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  }
});
