import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuth } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

const updateApiToken = (token: string | null) => {
	if (token) axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	else delete axiosInstance.defaults.headers.common["Authorization"];
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const { getToken, userId } = useAuth();
	const [loading, setLoading] = useState(true);
	const { checkAdminStatus } = useAuthStore();
	const { initSocket, disconnectSocket } = useChatStore();

	useEffect(() => {
		const initAuth = async () => {
			try {
				const token = await getToken();
				updateApiToken(token);

				// Only proceed if we have both token and userId
				if (token && userId && userId !== 'undefined' && userId !== undefined) {
					await checkAdminStatus();
					// init socket
					initSocket(userId);
				} else if (token && (!userId || userId === 'undefined' || userId === undefined)) {
					// Token exists but userId is not available yet - this is normal during initial load
					console.log("Token available but userId not yet loaded, waiting...");
				} else {
					// No token or invalid userId
					console.log("No token available or invalid userId");
				}
			} catch (error: any) {
				console.error("Auth initialization error:", error);
				updateApiToken(null);
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		// clean up
		return () => disconnectSocket();
	}, [getToken, checkAdminStatus, initSocket, disconnectSocket]);

	// Separate effect to handle userId changes after initial load
	useEffect(() => {
		const handleUserIdChange = async () => {
			if (userId && userId !== 'undefined' && userId !== undefined) {
				try {
					const token = await getToken();
					if (token) {
						await checkAdminStatus();
						initSocket(userId);
					}
				} catch (error) {
					console.error("Error handling userId change:", error);
				}
			}
		};

		handleUserIdChange();
	}, [userId, getToken, checkAdminStatus, initSocket]);

	if (loading)
		return (
			<div className='h-screen w-full flex items-center justify-center'>
				<Loader className='size-8 text-emerald-500 animate-spin' />
			</div>
		);

	return <>{children}</>;
};
export default AuthProvider;
