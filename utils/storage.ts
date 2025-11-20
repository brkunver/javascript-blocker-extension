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
      // Handle both old format (array of strings) and already migrated format (array of objects)
      return oldValue
        .map((item: string | blockedUrl) => {
          // If already an object with url property, return as is
          if (typeof item === "object" && item !== null && "url" in item) {
            return item
          }
          // If it's a string, convert to new format
          if (typeof item === "string") {
            return { url: item, active: true }
          }
          // Fallback for unexpected data - skip it
          return null
        })
        .filter((item: blockedUrl | null): item is blockedUrl => item !== null)
    },
  },
})

export const isExtensionActive = storage.defineItem<boolean>("local:isExtensionActive", {
  fallback: true,
})
