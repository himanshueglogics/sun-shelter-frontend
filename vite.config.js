// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    server: {
        host: true,
    },
    devServer: {
        allowedHosts: 'all',
        // or specify:
        // allowedHosts: ['.ngrok.io'],
    },
});