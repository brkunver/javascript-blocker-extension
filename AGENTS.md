# Agent Notes

- Read this file before making changes in this repository.
- This is a WXT + Svelte browser extension for blocking user-defined JavaScript URLs.
- Prefer small, behavior-preserving changes unless the user asks for a broader refactor.
- Keep `wxt.config.ts` and generated manifests in sync; verify fresh build output before trusting `.output`.
- For reliability work, check background rule lifecycle, storage migrations, popup import/export validation, and release scripts.
- Before finishing code changes, run the most relevant check such as `pnpm run check`, `pnpm run build`, or `pnpm run build:firefox`.
