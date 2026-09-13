# Rarry

Rarry is a web-based platform that allows to create games or projects using visual block-coding, powered by [Blockly](https://developers.google.com/blockly).
Snap blocks together in a Blockly workspace, the blocks compile to JavaScript and execute on a custom VM. Rarry also ships as a desktop app built with [Tauri](https://tauri.app/).

## Development setup

Requires [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

| Command            | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `pnpm install`     | Install dependencies                                           |
| `pnpm dev`         | Start the Vite dev server (also used by Tauri as its `devUrl`) |
| `pnpm build`       | Production build via Vite                                      |
| `pnpm preview`     | Preview the production build                                   |
| `pnpm lint`        | Run ESLint                                                     |
| `pnpm tauri dev`   | Run the desktop app in development                             |
| `pnpm tauri build` | Build a release desktop app (requires Rust toolchain)          |

## Links

- Website: https://rarry.link/
- Documentation: https://docs.rarry.link/

## License

[MIT](LICENSE)
