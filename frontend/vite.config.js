import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // FastAPI backend (see /backend): signed URL + transcript POST without CORS friction in dev
      "/get_conversation": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/get_preferences": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/getCourses": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/getPeople": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/conversation": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/signed-url": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
