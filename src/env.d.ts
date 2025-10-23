// Ambient declarations for SvelteKit virtual env modules used in this project.
// These are typed minimally to satisfy TypeScript and IDEs. If you use
// additional environment variables, add them here.

declare module '$env/static/private' {
  // server-only compile-time private env vars
  export const SUPABASE_URL: string;
  export const SUPABASE_SERVICE_ROLE_KEY: string;
}

declare module '$env/dynamic/private' {
  // runtime server-only environment object
  export const env: { [key: string]: string | undefined };
}

declare module '$env/static/public' {
  // compile-time public env vars
  export const PUBLIC_SUPABASE_URL: string;
  export const PUBLIC_SUPABASE_ANON_KEY: string;
}

declare module '$env/dynamic/public' {
  // runtime public environment object
  export const env: { [key: string]: string | undefined };
}