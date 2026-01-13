import { Card, CardContent } from "@/components/ui/card";
import { axiosInstance } from "@/lib/axios";
import { useUser } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallbackPage = () => {
	const { isLoaded, user } = useUser();
	const navigate = useNavigate();
	const syncAttempted = useRef(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const syncUser = async () => {
			if (!isLoaded || !user || syncAttempted.current) return;

			try {
				syncAttempted.current = true;
				console.log("Syncing user:", user.id);

				await axiosInstance.post("/auth/callback", {
					id: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					imageUrl: user.imageUrl,
				});

				console.log("User synced successfully, redirecting...");
				navigate("/");
			} catch (error: any) {
				console.error("Auth callback error:", error);
				setError(error.response?.data?.message || "Failed to sync user");
				// Still redirect after 2 seconds even on error
				setTimeout(() => navigate("/"), 2000);
			}
		};

		syncUser();
	}, [isLoaded, user, navigate]);

	return (
		<div className='h-screen w-full bg-black flex items-center justify-center'>
			<Card className='w-[90%] max-w-md bg-zinc-900 border-zinc-800'>
				<CardContent className='flex flex-col items-center gap-4 pt-6'>
					<Loader className='size-6 text-emerald-500 animate-spin' />
					<h3 className='text-zinc-400 text-xl font-bold'>Logging you in</h3>
					<p className='text-zinc-400 text-sm'>
						{error ? error : "Redirecting..."}
					</p>
				</CardContent>
			</Card>
		</div>
	);
};
export default AuthCallbackPage;
