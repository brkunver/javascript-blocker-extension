<script lang="ts">
  import { blockedJsUrls } from "@@/utils/storage"

  let urls = $state<string[]>([])
  let input = $state<string>("")

  $effect(() => {
    blockedJsUrls.getValue().then(loadedUrls => {
      urls = loadedUrls
    })

    const unwatch = blockedJsUrls.watch(newUrls => {
      urls = newUrls
    })

    return () => unwatch()
  })

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
      alert("Please enter a valid URL.") // Or some other user feedback
      return
    }

    // Check for duplicates before adding
    if (urls.includes(processedInput)) {
      alert("This URL is already in the list.")
      input = "" // Clear input even if it's a duplicate
      return
    }

    const newUrls = [...urls, processedInput]
    await blockedJsUrls.setValue(newUrls)
    input = ""
  }

  async function removeUrl(index: number) {
    const newUrls = urls.filter((_, i) => i !== index)
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
        if (Array.isArray(importedUrls) && importedUrls.every(item => typeof item === "string")) {
          await blockedJsUrls.setValue(importedUrls)
          alert("Rules imported successfully!")
        } else {
          alert("Invalid file format.")
        }
      } catch (error) {
        alert("Error reading or parsing file.")
      }
    }
    reader.readAsText(file)
  }
</script>

<main class="p-6 max-w-lg mx-auto min-h-[400px] min-w-[400px]">
  <h1 class="text-2xl font-bold mb-4">JS Blocker</h1>

  <div class="flex gap-2 mb-4">
    <input
      bind:value={input}
      type="text"
      placeholder="https://example.com/bad.js"
      class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      onkeydown={e => e.key === "Enter" && addUrl()}
    />
    <button
      onclick={addUrl}
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
    >
      Add
    </button>
  </div>

  <div class="flex gap-2 mb-4">
    <button
      onclick={exportRules}
      class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer transition"
    >
      Export Rules
    </button>
    <label class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 cursor-pointer transition">
      Import Rules
      <input type="file" class="hidden" onchange={importRules} accept=".json" />
    </label>
  </div>

  <ul class="space-y-2">
    {#each urls as url, i}
      <li class="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
        <code class="text-sm text-gray-700 break-all">{url}</code>
        <button onclick={() => removeUrl(i)} class="ml-2 text-red-600 hover:text-red-800 text-sm cursor-pointer">
          Remove
        </button>
      </li>
    {:else}
      <li class="text-gray-500 text-center py-4">No blocked JS yet</li>
    {/each}
  </ul>
</main>
