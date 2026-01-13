import axios from "axios";

const backendURL = import.meta.env.VITE_BACKEND_URL || 
	(import.meta.env.MODE === "development" ? "http://localhost:5000" : "");

export const axiosInstance = axios.create({
	baseURL: backendURL ? `${backendURL}/api` : "/api",
	withCredentials: true,
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
	async (config) => {
		// Get the token from Clerk
		try {
			const token = await window.Clerk?.session?.getToken();
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		} catch (error) {
			console.warn("Failed to get auth token:", error);
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("API Error:", error.response?.data || error.message);
		return Promise.reject(error);
	}
);
