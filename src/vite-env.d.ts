/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
