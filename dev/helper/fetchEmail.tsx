export const fetchEmail = async () => {
	try {
		const response = await fetch('/oauth2/userinfo').catch(() => new Response(null, { status: 401 }));
		const data = await response.json().catch(() => { email: "n/a" }) as { email: string } || { email: "n/a" };
		return data?.email ?? "n/a";
	} catch (error) {
		console.error('Error fetching email:', error);
		return 'n/a';
	}
};