import { blockedJsUrls, isExtensionActive, normalizeBlockedUrls } from "@@/utils/storage"

export default defineBackground(() => {
  const hasNativeBadge = typeof browser.declarativeNetRequest.setExtensionActionOptions === "function"

  async function configureBadge() {
    try {
      await browser.action.setBadgeBackgroundColor({ color: "#d9534f" })
      if (hasNativeBadge) {
        await browser.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true })
      }
    } catch (error) {
      console.error("JavaScript Blocker: Error configuring badge:", error)
    }
  }

  void configureBadge()

  // Fallback for browsers without native action counts during development.
  const blockedCountPerTab = new Map<number, number>()

  function updateBadge(tabId: number) {
    const count = blockedCountPerTab.get(tabId) || 0
    const badgeText = count > 0 ? count.toString() : ""

    browser.action.setBadgeText({
      text: badgeText,
      tabId: tabId,
    })
  }

  // Listen for blocked requests using declarativeNetRequest
  if (!hasNativeBadge && import.meta.env.DEV && browser.declarativeNetRequest.onRuleMatchedDebug) {
    browser.declarativeNetRequest.onRuleMatchedDebug.addListener(details => {
      const tabId = details.request.tabId
      if (typeof tabId === "number" && tabId !== -1) {
        const currentCount = blockedCountPerTab.get(tabId) || 0
        blockedCountPerTab.set(tabId, currentCount + 1)
        updateBadge(tabId)
      }
    })
  }

  // Reset counter when navigating to a new page
  browser.webNavigation.onCommitted.addListener(details => {
    if (!hasNativeBadge && details.frameId === 0) {
      // Main frame navigation
      blockedCountPerTab.set(details.tabId, 0)
      updateBadge(details.tabId)
    }
  })

  // Clean up when tab is closed
  browser.tabs.onRemoved.addListener(tabId => {
    blockedCountPerTab.delete(tabId)
  })

  async function updateRules() {
    try {
      const storedUrls = await blockedJsUrls.getValue()
      const activeUrls = normalizeBlockedUrls(storedUrls).filter(u => u.active)
      const validUrls = activeUrls.map(u => u.url.trim()).filter(Boolean)
      const oldRules = await browser.declarativeNetRequest.getDynamicRules()
      const oldRuleIds = oldRules.map(r => r.id)
      const activeStatus = await isExtensionActive.getValue()

      if (!activeStatus) {
        await browser.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: oldRuleIds,
        })
        return
      }

      const newRules = validUrls.map((url, i) => ({
        id: i + 1, // Recreate rule IDs
        priority: 1,
        action: { type: "block" as const },
        condition: {
          // Use wildcard if already present in URL, otherwise add to beginning and end.
          urlFilter: url.includes("*") ? url : `*${url}*`,
          resourceTypes: ["script" as const],
        },
      }))

      // Remove old rules and add new ones in a single atomic operation
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: newRules,
      })
    } catch (error) {
      console.error("JavaScript Blocker: Error updating rules:", error)
    }
  }

  let updating = false
  let updatePending = false

  async function scheduleRuleUpdate() {
    updatePending = true
    if (updating) {
      return
    }

    updating = true
    try {
      while (updatePending) {
        updatePending = false
        await updateRules()
      }
    } finally {
      updating = false
    }
  }

  blockedJsUrls.watch(scheduleRuleUpdate)
  isExtensionActive.watch(scheduleRuleUpdate)
  void scheduleRuleUpdate()
})
