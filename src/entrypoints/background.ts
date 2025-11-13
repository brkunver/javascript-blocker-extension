import { blockedJsUrls, isExtensionActive } from "@@/utils/storage"
import type { blockedUrl } from "@@/utils/storage"

export default defineBackground(() => {
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
