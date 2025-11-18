interface Window {
  Peer: any;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}