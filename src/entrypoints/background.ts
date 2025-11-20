import { blockedJsUrls, isExtensionActive } from "@@/utils/storage"
import type { blockedUrl } from "@@/utils/storage"

export default defineBackground(() => {
  // Track blocked requests per tab
  const blockedCountPerTab = new Map<number, number>()

  // Set badge background color (red like uBlock Origin)
  browser.action.setBadgeBackgroundColor({ color: "#d9534f" })

  function updateBadge(tabId: number) {
    const count = blockedCountPerTab.get(tabId) || 0
    const badgeText = count > 0 ? count.toString() : ""

    browser.action.setBadgeText({
      text: badgeText,
      tabId: tabId,
    })
  }

  // Listen for blocked requests using declarativeNetRequest
  if (browser.declarativeNetRequest.onRuleMatchedDebug) {
    browser.declarativeNetRequest.onRuleMatchedDebug.addListener(details => {
      if (details.request.tabId && details.request.tabId !== -1) {
        const currentCount = blockedCountPerTab.get(details.request.tabId) || 0
        blockedCountPerTab.set(details.request.tabId, currentCount + 1)
        updateBadge(details.request.tabId)
      }
    })
  }

  // Reset counter when navigating to a new page
  browser.webNavigation.onCommitted.addListener(details => {
    if (details.frameId === 0) {
      // Main frame navigation
      blockedCountPerTab.set(details.tabId, 0)
      updateBadge(details.tabId)
    }
  })

  // Clean up when tab is closed
  browser.tabs.onRemoved.addListener(tabId => {
    blockedCountPerTab.delete(tabId)
  })

  async function updateRules(urls: blockedUrl[] | null | undefined) {
    try {
      // Clean the incoming URL list: remove spaces and filter out empty elements.
      const activeUrls = (urls || []).filter(u => u.active)
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

      console.log("JavaScript Blocker: Rules updated successfully.", newRules)
    } catch (error) {
      console.error("JavaScript Blocker: Error updating rules:", error)
    }
  }

  // Load existing rules when the extension starts
  blockedJsUrls.getValue().then(() => updateRules(null))
  isExtensionActive.getValue().then(() => updateRules(null))

  // Monitor changes in storage and update rules
  blockedJsUrls.watch(newValue => {
    updateRules(newValue)
  })

  isExtensionActive.watch(() => {
    updateRules(null)
  })
})
