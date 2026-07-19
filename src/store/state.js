import { createStore } from "../store.js";

export const store = createStore({
  activeSprite: null,
  spriteVersion: 0,
  activeTab: "code"
});
