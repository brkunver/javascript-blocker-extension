import { storage } from "#imports"

export const blockedJsUrls = storage.defineItem<string[]>("local:blockedJsUrls", {
  fallback: [],
})

export const isExtensionActive = storage.defineItem<boolean>("local:isExtensionActive", {
  fallback: true,
})
