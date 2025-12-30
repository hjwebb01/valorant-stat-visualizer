export const load = async ({ locals }: any) => {
	if (!locals.session || !locals.user) {
		return { user: null };
	}

	return {
		user: {
			email: locals.user.email,
			id: locals.user.id
		}
	};
};
