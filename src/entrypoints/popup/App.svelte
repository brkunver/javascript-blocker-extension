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
    <button onclick={addUrl} class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
      Add
    </button>
  </div>

  <ul class="space-y-2">
    {#each urls as url, i}
      <li class="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
        <code class="text-sm text-gray-700 break-all">{url}</code>
        <button onclick={() => removeUrl(i)} class="ml-2 text-red-600 hover:text-red-800 text-sm cursor-pointer"
          >Remove</button
        >
      </li>
    {:else}
      <li class="text-gray-500 text-center py-4">No blocked JS yet</li>
    {/each}
  </ul>
</main>
