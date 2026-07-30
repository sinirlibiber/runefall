/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHELBY_ENABLED: string;
  readonly VITE_SHELBY_API_KEY: string;
  readonly VITE_SHELBY_ACCOUNT_ADDRESS: string;
  readonly VITE_SHELBY_PRIVATE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
