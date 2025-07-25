import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/mcp": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/llm": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/langchain": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "^/chat/(create-session|list-sessions|get-history|delete-session)": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
