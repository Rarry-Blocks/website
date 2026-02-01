const keywords = new Set([
  "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "export", "extends", "finally",
  "for", "function", "if", "import", "in", "instanceof", "let", "new",
  "return", "super", "switch", "this", "throw", "try", "typeof", "var",
  "void", "while", "with", "yield", "await"
]);
const globals = new Set(Object.getOwnPropertyNames(globalThis));
const engine = new Set([
  "BUBBLE_TEXTSTYLE", "MyFunctions", "Thread", "_", "_startTween",
  "abort", "activeEventThreads", "app", "clearPen", "code",
  "costumeMap", "eventRegistry", "fastExecution", "findOrFilterItem",
  "getAngle", "getCostumeSize", "getMousePosition",
  "getSpriteScale", "hideSprite", "indexForEach", "isKeyPressed",
  "isMouseButtonPressed", "isMouseTouchingSprite", "keysPressed",
  "mouseButtonsPressed", "moveSteps", "penGraphics", "playSound",
  "playingSounds", "projectStartedTime", "projectTime",
  "registerEvent", "renderer", "runningScripts", "sayMessage",
  "setAngle", "setPenColor", "setPenColorHex", "setPenSize",
  "setPenStatus", "setSize", "setSoundProperty", "setsForEachItem",
  "showSprite", "signal", "soundMap", "soundProperties", "sprite",
  "spriteData", "spriteManager", "stage", "startTween",
  "stopAllSounds", "stopSound", "stopped", "switchCostume",
  "triggerCustomEvent", "wait", "waitOneFrame", "whenFlagClicked"
]);

const localhost = window.location.hostname === "localhost";

export default {
  apiUrl: localhost ? "http://localhost:3000" : "https://rarry-api-production.up.railway.app",
  reservedWords: { all: new Set(keywords, globals, engine), keywords, globals, engine }
};
