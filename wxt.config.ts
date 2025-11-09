import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "JavaScript Blocker",
    description: "Block JavaScript on websites",
    permissions: ["storage", "declarativeNetRequest", "declarativeNetRequestFeedback"],
    host_permissions: ["<all_urls>"],
  },
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    disabled: true,
  },
})
