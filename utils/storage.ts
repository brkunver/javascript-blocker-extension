import { storage } from "#imports"

export type blockedUrl = {
  url: string
  active: boolean
}

export const blockedJsUrls = storage.defineItem<blockedUrl[]>("local:blockedJsUrls", {
  version: 2,
  fallback: [],
  migrations: {
    1: oldValue => {
      return oldValue
    },
    2: oldValue => {
      return oldValue.map((url: string) => ({ url, active: true }))
    },
  },
})

export const isExtensionActive = storage.defineItem<boolean>("local:isExtensionActive", {
  fallback: true,
})
