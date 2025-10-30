Mint-Ec Zertifikat Generator

## UI and Design System

A global theme has been introduced in `src/theme.css` to provide a consistent, modern look across all pages and popups. It defines:
- CSS variables for colors, spacing, and fluid typography
- Unified components (buttons, inputs, cards, tables, popups)
- Responsive layout that scales from 720p up to 4K displays
- A backdrop overlay for the side navigation

How to use in pages:
- Include `<link rel="stylesheet" href="theme.css" />` in the page head (already wired in all pages)
- Keep existing IDs for JS hooks. You can add utility classes like `card`, `page-actions`, or use `.blauerButton`/`.roterButton` which are themed
- For elements that should be disabled when no student is selected, use the class `disabled-no-student`
- To visually dim sections when no student is selected, add the class `darken` (logic handled in `src/main.js`)

## Development

Building purpose only:

```
cargo tauri dev --no-watch
cargo tauri build
```

Notes:
- The side navigation now shows a dimmed backdrop; clicking outside closes it
- Search suggestions are positioned relative to the search box for better responsiveness
- Content is scrollable on smaller screens; avoid setting fixed viewport heights where possible
