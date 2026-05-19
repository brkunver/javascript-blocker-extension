import { storage } from "#imports"

export type blockedUrl = {
  url: string
  active: boolean
}

const MAX_RULES = 5000

function hasProtocol(value: string) {
  return /^https?:\/\//i.test(value)
}

function hasWildcard(value: string) {
  return value.includes("*")
}

function hasSearchableText(value: string) {
  return /[a-z0-9]/i.test(value)
}

export function normalizeBlockedUrlInput(value: unknown): string | null {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048 || /[\u0000-\u001F\u007F\s]/.test(trimmed)) return null

  if (hasWildcard(trimmed)) {
    if (!hasSearchableText(trimmed)) return null
    return trimmed
  }

  const withProtocol = hasProtocol(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString()
  } catch {
    return null
  }
}

export function normalizeBlockedUrls(value: unknown): blockedUrl[] {
  if (!Array.isArray(value)) return []

  const normalizedUrls: blockedUrl[] = []
  const seenUrls = new Set<string>()

  for (const item of value) {
    const url = normalizeBlockedUrlInput(
      typeof item === "string" ? item : typeof item === "object" && item !== null && "url" in item ? item.url : null,
    )
    if (!url) continue

    const active = typeof item === "object" && item !== null && "active" in item ? item.active === true : true
    const dedupeKey = url.toLowerCase()
    if (seenUrls.has(dedupeKey)) continue

    seenUrls.add(dedupeKey)
    normalizedUrls.push({ url, active })

    if (normalizedUrls.length >= MAX_RULES) break
  }

  return normalizedUrls
}

export const blockedJsUrls = storage.defineItem<blockedUrl[]>("sync:blockedJsUrls", {
  version: 2,
  fallback: [],
  migrations: {
    1: oldValue => {
      return oldValue
    },
    2: oldValue => {
      return normalizeBlockedUrls(oldValue)
    },
  },
})

export const isExtensionActive = storage.defineItem<boolean>("local:isExtensionActive", {
  fallback: true,
})
