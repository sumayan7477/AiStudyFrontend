/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL including /api, e.g. https://localhost:7075/api (see .env.example). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
