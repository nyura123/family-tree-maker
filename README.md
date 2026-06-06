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
npm run build:deploy
```

Output is written to `dist/`:

- `dist/index.html`
- `dist/app.js`
- `dist/style.css`

Preview the build locally:

```bash
npm run preview:deploy
```

## Deploy To Wisp

Requires wisp-cli installed and authenticated.

Deploy using existing dist output:

```bash
npm run deploy:wisp
```

Build and deploy in one command:

```bash
npm run deploy
```