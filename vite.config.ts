import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer, setupSocketIO } from "./server";
import { Server as SocketServer } from "socket.io";
import { validateEnvironment } from "./server/config/env";

// Validate environment on startup
validateEnvironment();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(viteServer) {
      const app = createServer();

      // Set up Socket.io
      const io = new SocketServer(viteServer.httpServer!, {
        cors: {
          origin: process.env.CLIENT_URL || 'http://localhost:8080',
          credentials: true,
        },
      });

      setupSocketIO(io, app);

      // Add Express app as middleware to Vite dev server
      viteServer.middlewares.use(app);
    },
  };
}

