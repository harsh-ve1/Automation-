import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In our custom environment, we can configure a proxy or let it resolve from host
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
