import { store } from "./state.js";

export function setupSubscriptions({
  renderSpritesList,
  renderCostumesList,
  renderSoundsList,
  resetSpriteInfo,
  workspace,
  deleteSpriteButton
}) {
  store.on("activeSprite", sprite => {
    renderSpritesList(true);
    resetSpriteInfo();
    deleteSpriteButton.disabled = !sprite;
    workspace.getParentSvg().parentNode.style.display = sprite ? "" : "none";
  });

  store.on("spriteVersion", () => {
    renderSpritesList(false);
  });

  store.on("activeTab", tab => {
    if (tab === "costumes") renderCostumesList();
    if (tab === "sounds") renderSoundsList();
  });
}
