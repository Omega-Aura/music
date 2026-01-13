import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";

const DebugPage = () => {
	const [config, setConfig] = useState({
		backendURL: "",
		baseURL: "",
		mode: "",
	});
	const [apiTest, setApiTest] = useState<{ status: string; message: string } | null>(null);

	useEffect(() => {
		const backendURL = import.meta.env.VITE_BACKEND_URL || 
			(import.meta.env.MODE === "development" ? "http://localhost:5000" : "");
		
		setConfig({
			backendURL: import.meta.env.VITE_BACKEND_URL || "NOT SET",
			baseURL: backendURL ? `${backendURL}/api` : "/api",
			mode: import.meta.env.MODE,
		});

		// Test API connection
		const testConnection = async () => {
			try {
				const response = await axiosInstance.get("/songs/featured");
				setApiTest({ status: "success", message: `Found ${response.data.length} songs` });
			} catch (error: any) {
				setApiTest({ 
					status: "error", 
					message: error.response?.status 
						? `${error.response.status}: ${error.response.data?.message || error.message}`
						: error.message 
				});
			}
		};

		testConnection();
	}, []);

	return (
		<div className="p-8 text-white">
			<h1 className="text-3xl font-bold mb-6">Debug Configuration</h1>
			
			<div className="space-y-4 bg-zinc-800 p-6 rounded-lg">
				<div>
					<h2 className="text-xl font-semibold mb-2">Environment</h2>
					<p><strong>Mode:</strong> {config.mode}</p>
					<p><strong>VITE_BACKEND_URL:</strong> {config.backendURL}</p>
					<p><strong>Axios baseURL:</strong> {config.baseURL}</p>
				</div>

				<div className="mt-6">
					<h2 className="text-xl font-semibold mb-2">API Connection Test</h2>
					{apiTest ? (
						<div className={`p-4 rounded ${apiTest.status === "success" ? "bg-green-900" : "bg-red-900"}`}>
							<p><strong>Status:</strong> {apiTest.status}</p>
							<p><strong>Message:</strong> {apiTest.message}</p>
						</div>
					) : (
						<p>Testing...</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default DebugPage;
