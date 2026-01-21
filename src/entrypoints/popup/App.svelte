<script lang="ts">
  import { i18n } from "#i18n"
  import { blockedJsUrls, isExtensionActive, type blockedUrl } from "@@/utils/storage"

  let urls = $state<blockedUrl[]>([])
  let input = $state<string>("")
  let extensionActive = $state<boolean>(true)

  const t = i18n.t

  $effect(() => {
    blockedJsUrls.getValue().then(loadedUrls => {
      urls = loadedUrls
    })

    const unwatch = blockedJsUrls.watch(newUrls => {
      urls = newUrls
    })

    return () => unwatch()
  })

  $effect(() => {
    isExtensionActive.getValue().then(active => {
      extensionActive = active
    })

    const unwatch = isExtensionActive.watch(newActive => {
      extensionActive = newActive
    })

    return () => unwatch()
  })

  async function toggleExtension() {
    await isExtensionActive.setValue(!extensionActive)
  }

  async function addUrl() {
    let processedInput = input.trim()
    if (!processedInput) return

    // Add https:// if missing
    if (!processedInput.startsWith("http://") && !processedInput.startsWith("https://")) {
      processedInput = "https://" + processedInput
    }

    // Validate URL
    try {
      new URL(processedInput) // Attempt to create a URL object
    } catch (e) {
      alert(t("popup.invalidUrl")) // Or some other user feedback
      return
    }

    // Check for duplicates before adding
    if (urls.some(item => item.url === processedInput)) {
      alert(t("popup.urlAlreadyExists"))
      input = "" // Clear input even if it's a duplicate
      return
    }

    const newUrls = [...urls, { url: processedInput, active: true }]
    await blockedJsUrls.setValue(newUrls)
    input = ""
  }

  async function removeUrl(index: number) {
    const newUrls = urls.filter((_, i) => i !== index)
    await blockedJsUrls.setValue(newUrls)
  }

  async function toggleUrlStatus(index: number) {
    const newUrls = [...urls]
    newUrls[index].active = !newUrls[index].active
    await blockedJsUrls.setValue(newUrls)
  }

  function exportRules() {
    const data = JSON.stringify(urls, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "blocked-js-rules.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  function importRules(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const importedUrls = JSON.parse(e.target?.result as string)
        if (
          Array.isArray(importedUrls) &&
          importedUrls.every(
            item => typeof item === "object" && typeof item.url === "string" && typeof item.active === "boolean",
          )
        ) {
          await blockedJsUrls.setValue(importedUrls)
          alert(t("popup.rulesImportedSuccessfully"))
        } else {
          alert(t("popup.invalidFileFormat"))
        }
      } catch (error) {
        alert(t("popup.errorReadingFile"))
      }
    }
    reader.readAsText(file)
  }
</script>

<main class="p-6 max-w-lg mx-auto min-h-[400px] min-w-[400px] bg-gray-50 rounded-lg shadow-lg">
  <h1 class="text-3xl font-extrabold mb-6 text-center text-gray-800">{t("popup.title")}</h1>

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
</main>
