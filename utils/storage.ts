import { storage } from "#imports"

export const blockedJsUrls = storage.defineItem<string[]>("local:blockedJsUrls", {
  fallback: [],
})
