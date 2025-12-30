/// <reference types="vite/client" />

interface Window {
	Clerk?: {
		session?: {
			getToken: () => Promise<string>;
		};
	};
}
