interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAX_ADVANCE_DAYS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
