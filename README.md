# Note

Note is a local-first Markdown workspace for developer documentation. Notes are stored in the browser's `localStorage` and in a local `notes` folder. On first launch, choose the application's root folder when prompted; Note creates `notes` if needed and imports Markdown files from it on startup. The selected folder is remembered by the browser.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` for a production build and `npm run preview` to preview it.

## Included

- Live Markdown preview with GFM tables, task lists, and strikethrough
- Syntax highlighting for fenced code blocks
- Multiple notes with create, rename, switch, delete, and automatic local saving
- Markdown export with a safe filename
- Responsive edit/preview toggle on small screens

The storage layer is isolated in `src/utils/storage.ts` so it can later be replaced with a database or sync API.
