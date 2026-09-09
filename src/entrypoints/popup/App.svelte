<script lang="ts">
  import { i18n } from "#i18n"
  import {
    blockedJsUrls,
    isExtensionActive,
    normalizeBlockedUrlInput,
    normalizeBlockedUrls,
    MAX_RULES,
    type blockedUrl,
  } from "@@/utils/storage"

  let urls = $state<blockedUrl[]>([])
  let input = $state<string>("")
  let extensionActive = $state<boolean>(true)
  let busy = $state(false)
  let loaded = $state(false)

  const t = i18n.t

  $effect(() => {
    let disposed = false
    let urlsChanged = false
    let activeChanged = false
    const unwatch = blockedJsUrls.watch(newUrls => {
      urlsChanged = true
      urls = normalizeBlockedUrls(newUrls)
    })
    const unwatchActive = isExtensionActive.watch(newActive => {
      activeChanged = true
      extensionActive = newActive
    })

    async function loadSettings() {
      try {
        const [storedUrls, active] = await Promise.all([blockedJsUrls.getValue(), isExtensionActive.getValue()])
        if (disposed) {
          return
        }
        if (!urlsChanged) {
          urls = normalizeBlockedUrls(storedUrls)
        }
        if (!activeChanged) {
          extensionActive = active
        }
        loaded = true
      } catch (error) {
        console.error("Failed to load settings:", error)
        alert(t("popup.settingsLoadFailed"))
      }
    }

    void loadSettings()
    return () => {
      disposed = true
      unwatch()
      unwatchActive()
    }
  })

  async function saveSettings(save: () => Promise<void>) {
    if (busy || !loaded) {
      return false
    }
    busy = true
    try {
      await save()
      return true
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert(t("popup.settingsSaveFailed"))
      return false
    } finally {
      busy = false
    }
  }

  async function saveUrls(newUrls: blockedUrl[]) {
    if (newUrls.length > MAX_RULES) {
      alert(t("popup.ruleLimitExceeded"))
      return false
    }
    const bytes = new TextEncoder().encode("blockedJsUrls" + JSON.stringify(newUrls)).length
    if (bytes > 8192) {
      alert(t("popup.storageLimitExceeded"))
      return false
    }
    return await saveSettings(async () => {
      await blockedJsUrls.setValue(newUrls)
      urls = newUrls
    })
  }

  async function toggleExtension() {
    await saveSettings(async () => {
      const newActive = !extensionActive
      await isExtensionActive.setValue(newActive)
      extensionActive = newActive
    })
  }

  async function addUrl() {
    const processedInput = normalizeBlockedUrlInput(input)
    if (!processedInput) {
      alert(t("popup.invalidUrl"))
      return
    }

    // Check for duplicates before adding
    if (urls.some(item => item.url.toLowerCase() === processedInput.toLowerCase())) {
      alert(t("popup.urlAlreadyExists"))
      input = "" // Clear input even if it's a duplicate
      return
    }

    const newUrls = [...urls, { url: processedInput, active: true }]
    if (await saveUrls(newUrls)) {
      input = ""
    }
  }

  async function removeUrl(index: number) {
    const newUrls = urls.filter((_, i) => i !== index)
    await saveUrls(newUrls)
  }

  async function toggleUrlStatus(index: number) {
    const newUrls = urls.map((item, i) => (i === index ? { ...item, active: !item.active } : item))
    await saveUrls(newUrls)
  }

  function exportRules() {
    const data = JSON.stringify(urls, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "blocked-js-rules.json"
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importRules(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }
    const file = target.files?.[0]
    target.value = ""
    if (!file) {
      return
    }

    try {
      const data: unknown = JSON.parse(await file.text())
      if (!Array.isArray(data) || data.some(item => normalizeBlockedUrls([item]).length !== 1)) {
        alert(t("popup.invalidFileFormat"))
        return
      }
      if (data.length > MAX_RULES) {
        alert(t("popup.ruleLimitExceeded"))
        return
      }
      if (await saveUrls(normalizeBlockedUrls(data))) {
        alert(t("popup.rulesImportedSuccessfully"))
      }
    } catch (error) {
      alert(t("popup.errorReadingFile"))
    }
  }
</script>

<main class="p-6 max-w-lg mx-auto min-h-[400px] min-w-[400px] bg-gray-50 rounded-lg shadow-lg">
  <h1 class="text-3xl font-extrabold mb-6 text-center text-gray-800">{t("popup.title")}</h1>
  <fieldset disabled={busy || !loaded} class="min-w-0 border-0 p-0 m-0">

    <div class="mb-6">
      <button
        onclick={toggleExtension}
        class="w-full px-5 py-3 font-bold text-white rounded-lg transition duration-200 ease-in-out shadow-md text-lg cursor-pointer
        {extensionActive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}"
      >
        {extensionActive ? t("popup.extensionActive") : t("popup.extensionInactive")}
      </button>
    </div>

    <div class="flex gap-3 mb-4">
      <input
        bind:value={input}
        type="text"
        placeholder="https://example.com/bad.js"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
        onkeydown={e => e.key === "Enter" && addUrl()}
      />
      <button
        onclick={addUrl}
        class="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out shadow-md cursor-pointer"
      >
        {t("popup.addUrl")}
      </button>
    </div>

    <div class="flex gap-3 mb-6">
      <button
        onclick={exportRules}
        class="flex-1 px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200 ease-in-out shadow-md cursor-pointer"
      >
        {t("popup.exportRules")}
      </button>
      <label
        class="flex-1 px-5 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition duration-200 ease-in-out cursor-pointer text-center shadow-md"
      >
        {t("popup.importRules")}
        <input type="file" class="hidden" onchange={importRules} accept=".json" />
      </label>
    </div>

    <ul class="space-y-3 border-t border-gray-200 pt-4">
      {#each urls as url, i}
        <li class="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <code class="text-sm text-gray-700 break-all font-mono">{url.url}</code>
          <div class="flex items-center gap-2">
            <button
              onclick={() => toggleUrlStatus(i)}
              class="text-sm font-medium px-3 py-1 rounded-md transition duration-200 ease-in-out shadow-sm cursor-pointer
              {url.active ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}"
            >
              {url.active ? t("popup.deactivate") : t("popup.activate")}
            </button>
            <button
              onclick={() => removeUrl(i)}
              class="text-red-600 hover:text-red-800 text-sm font-medium transition duration-200 ease-in-out cursor-pointer"
            >
              {t("popup.remove")}
            </button>
          </div>
        </li>
      {:else}
        <li class="text-gray-500 text-center py-6 text-md italic">{t("popup.noBlockedJs")}</li>
      {/each}
    </ul>
  </fieldset>
</main>
