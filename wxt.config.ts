import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "__MSG_EXTENSION_NAME__",
    description: "__MSG_EXTENSION_DESCRIPTION__",
    permissions: ["storage", "declarativeNetRequest", "declarativeNetRequestFeedback", "webNavigation"],
    host_permissions: ["<all_urls>"],
    default_locale: "en",
  },
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/i18n/module"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    disabled: true,
  },
})
