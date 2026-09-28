// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE: string;
    readonly VITE_Image_URL:string;
    readonly VITE_TraceAPI_URL:string;
    readonly VITE_GOOGLE_MAPS_API_KEY:string;
    readonly DEV: boolean;
    // Add other VITE_ env vars here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  declare module '*.mjs?url' {
  const src: string;
  export default src;
}

declare module '*.docx?url' {
  const src: string;
  export default src;
}
  