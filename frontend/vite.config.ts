import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3000,
		cors: {
			origin: true,
			credentials: true,
		},
		proxy: {
			'/api-js.mixpanel.com': {
				target: 'https://api-js.mixpanel.com',
				changeOrigin: true,
				secure: true,
			},
		},
	},
});
