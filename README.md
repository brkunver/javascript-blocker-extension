# Javascript Blocker Extension

**Work in progress**

Block javascript on websites

Chrome Web Store: https://chromewebstore.google.com/detail/dghcgbdndfhhfcjgkdhfghkcpidonbke?utm_source=item-share-cb

Firefox Add-On Store : https://addons.mozilla.org/en-US/firefox/addon/javascript-blocker/

Planning to add:

- [x] import / export blocked js urls
- [x] disable globally
- [x] disable enable scripts
- [x] block count
- [ ] disable for specific sites
- [x] internationalization

## Development

Use Bun to install dependencies and run scripts:

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
bun run build:firefox
```

Load `.output/chrome-mv3` or `.output/firefox-mv2` after a production build.
Development builds use separate output directories; use the path printed by WXT.
The development server does not automatically launch a browser.

Run `bun run zip:all` to package Chrome and Firefox in parallel using Bun's built-in script runner.

## Limitations

- Rules block external script requests, including on matching URLs across all websites. Inline JavaScript is not blocked.
- The rule list is synced between browsers on the same account and must fit within the browser's 8 KB per-item sync quota.
- Wildcard filters must use ASCII characters. Use punycode domains and percent-encoded paths for international URLs.
- The badge uses the browser's native action counter where supported. Other browsers only have a development-mode fallback.
