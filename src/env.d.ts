// Shim for process.env to support existing service code using process.env.API_KEY
// This variable is injected via vite.define in astro.config.mjs

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
