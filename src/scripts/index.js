import { applyCustomColors, setupSettingsButton, setupUserTag } from "../functions/theme";

setupSettingsButton();
setupUserTag();
applyCustomColors();
if (window.__TAURI_INTERNALS__ !== undefined) {
  document.documentElement.classList.add("tauri");
}
