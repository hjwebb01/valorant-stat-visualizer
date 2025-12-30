import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll().map(({ name, value }) => ({ name, value })),
			setAll: (cookiesToSet) => {
				const isHttps = event.url.protocol === 'https:';
				const hostname = event.url.hostname;
				const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost');

				cookiesToSet.forEach(({ name, value, options }) => {
					const mergedOptions = {
						...options,
						path: '/',
						secure: isHttps
					} as any;

					// Browsers reject `Domain=localhost` (must be host-only cookies).
					if (isLocalhost && mergedOptions?.domain) {
						delete mergedOptions.domain;
					}

					event.cookies.set(name, value, mergedOptions);
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	if (event.url.pathname === '/bracket' && !event.locals.session) {
		redirect(303, '/?auth_required=true');
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
