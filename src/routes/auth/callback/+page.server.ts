import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			// Successfully exchanged code for session, redirect to intended destination
			redirect(303, next);
		}
		console.error('Error exchanging code for session:', error.message);
		// Redirect with error indicator
		redirect(303, '/?auth_error=true');
	}

	// No code present, just redirect to home
	redirect(303, '/');
};
