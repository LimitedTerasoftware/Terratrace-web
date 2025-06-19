// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE: string;
    readonly VITE_TraceAPI_URL:string;
    // Add other VITE_ env vars here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  