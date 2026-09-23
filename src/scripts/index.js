import { setupSettingsButton, setupUserTag } from "../functions/theme";

setupSettingsButton();
setupUserTag();
if (window.__TAURI_INTERNALS__ !== undefined) {
  document.documentElement.classList.add("tauri");
}
