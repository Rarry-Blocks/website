const localhost = window.location.hostname === "localhost";

export default {
  apiUrl: localhost ? "http://localhost:3000" : "https://rarry-api-production.up.railway.app",
  reservedWords: [
    "_", "whenFlagClicked", "moveSteps", "getAngle",
    "getMousePosition", "sayMessage", "waitOneFrame",
    "wait", "switchCostume", "setSize", "setAngle",
    "projectTime", "isKeyPressed", "isMouseButtonPressed",
    "getCostumeSize", "getSpriteScale", "_startTween",
    "startTween", "soundProperties", "setSoundProperty",
    "playSound", "stopSound", "stopAllSounds", "isMouseTouchingSprite",
    "setPenStatus", "setPenColor", "setPenColorHex", "setPenSize",
    "clearPen", "Thread", "fastExecution", "BUBBLE_TEXTSTYLE",
    "sprite", "renderer", "stage", "costumeMap", "soundMap",
    "stopped", "code", "penGraphics", "runningScripts",
    "findOrFilterItem", "registerEvent", "triggerCustomEvent",
    "hideSprite", "showSprite", "MyFunctions", "setsForEachItem",
    "indexForEach", "spriteManager", "projectStartedTime",
    "spriteData", "app", "eventRegistry", "mouseButtonsPressed",
    "keysPressed", "playingSounds", "signal", "activeEventThreads",
    "abort"
  ]
};
