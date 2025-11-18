/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly GEMINI_API_KEY?: string;
	readonly GEMINI_MODEL?: string;
	readonly PUBLIC_SIGNALING_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
