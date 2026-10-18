Mint-EC Zertifikat Generator

## Frontend

The desktop frontend is a Vue 3 + TypeScript single-page app built with Vite. The Rust/Tauri backend and SQLite database remain in `src-tauri`.

From the `src` directory, install the frontend dependencies once and run the desktop app:

```sh
npm install
npm run tauri:dev
```

Create a production build with:

```sh
npm run tauri:build
```

To build only the static frontend bundle, run `npm run build` in `src`.
