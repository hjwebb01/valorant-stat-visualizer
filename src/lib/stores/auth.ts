import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const loading = writable<boolean>(true);
export const error = writable<string | null>(null);

export const isLoggedIn = derived(user, ($user) => $user !== null);

export const userEmail = derived(user, ($user) => $user?.email ?? null);

export function initializeAuth() {
	loading.set(true);
	error.set(null);

	supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
		if (sessionError) {
			error.set(sessionError.message);
		} else {
			session.set(currentSession);
			user.set(currentSession?.user ?? null);
		}
		loading.set(false);
	});

	const {
		data: { subscription }
	} = supabase.auth.onAuthStateChange((event, currentSession) => {
		switch (event) {
			case 'SIGNED_IN':
			case 'TOKEN_REFRESHED':
				session.set(currentSession);
				user.set(currentSession?.user ?? null);
				break;
			case 'SIGNED_OUT':
				session.set(null);
				user.set(null);
				break;
		}
		loading.set(false);
	});

	return () => subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string) {
	loading.set(true);
	error.set(null);

	const { data, error: signInError } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	loading.set(false);

	if (signInError) {
		error.set(signInError.message);
		return false;
	}

	return true;
}

export async function signUp(email: string, password: string) {
	loading.set(true);
	error.set(null);

	const { data, error: signUpError } = await supabase.auth.signUp({
		email,
		password
	});

	loading.set(false);

	if (signUpError) {
		error.set(signUpError.message);
		return false;
	}

	return true;
}

export async function signInWithGoogle() {
	loading.set(true);
	error.set(null);

	const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
			queryParams: {
				access_type: 'offline',
				prompt: 'consent'
			}
		}
	});

	if (oauthError) {
		loading.set(false);
		error.set(oauthError.message);
		return false;
	}

	return true;
}

export async function signOut() {
	loading.set(true);
	error.set(null);

	const { error: signOutError } = await supabase.auth.signOut();

	loading.set(false);

	if (signOutError) {
		error.set(signOutError.message);
		return false;
	}

	return true;
}

export function clearError() {
	error.set(null);
}

export const login = signInWithPassword;
export const logout = signOut;
