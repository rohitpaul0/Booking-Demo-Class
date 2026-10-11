import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expose API_BASE_URL to client code. Vite only exposes vars matching
  // envPrefix; the default is "VITE_", so "API_" must be added explicitly.
  envPrefix: ["VITE_", "API_"],
});
