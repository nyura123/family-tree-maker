# family-tree-maker

https://family-tree-maker.wisp.place/

## Local Development

Run the app with a local origin to avoid file:// CORS/module restrictions.

```bash
npm run dev
```

Then open:

http://localhost:5173/

Optional: auto-open browser.

```bash
npm run dev:open
```

## Deploy Build

Generate a static deploy bundle where `index.html` imports a single JavaScript file.

```bash
npm run build
```

Output is written to `dist/`:

- `dist/index.html`
- `dist/app.js`
- `dist/style.css`

Preview the build locally:

```bash
npm run preview
```

## Deploy To Wisp

Requires wisp-cli installed and authenticated.

`npm run deploy:wisp` prompts for your Bluesky handle if none is configured.

Optional: set `WISP_HANDLE` to skip the prompt:

```bash
WISP_HANDLE=some-handle.bsky.social npm run deploy:wisp
```

Deploy using existing dist output:

```bash
npm run deploy:wisp
```

Build and deploy in one command:

```bash
npm run deploy
```