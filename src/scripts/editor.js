import "@fortawesome/fontawesome-free/css/all.min.css";

import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import * as PIXI from "pixi.js-legacy";
import pako from "pako";
import JSZip from "jszip";
import { io } from "socket.io-client";

import CustomRenderer from "../functions/render.js";
import { setupThemeButton } from "../functions/theme.js";
import {
  compressAudio,
  compressImage,
  showNotification,
  showPopup,
} from "../functions/utils.js";

import { Costume, Sprite, SpriteManager } from "../components/Sprite.js";
import { SpriteChangeEvents } from "../functions/patches.js";
import { registerExtension } from "../functions/extensionManager.js";
import { runCodeWithFunctions } from "../functions/runCode.js";

import builtInExtensions from "../functions/builtInExtensions.js";
import config from "../config";
import { VM } from "../components/VM.js";

BlocklyJS.javascriptGenerator.addReservedWords(
  [...config.reservedWords.all].join(",")
);

import.meta.glob("../blocks/**/*.js", { eager: true });

let currentSocket = null;
let currentRoom = null;
let amHost = false;
let invitesEnabled = true;
let connectedUsers = [];

const wrapper = document.getElementById("stage-wrapper");
const stageContainer = document.getElementById("stage");
const costumesList = document.getElementById("costumes-list");
const loadInput = document.getElementById("load-input");
const loadButton = document.getElementById("load-button");
const deleteSpriteButton = document.getElementById("delete-sprite-button");
const runButton = document.getElementById("run-button");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const fullscreenButton = document.getElementById("fullscreen-button");

export const BASE_WIDTH = 480;
export const BASE_HEIGHT = 360;
const MAX_HTTP_BUFFER = 20 * 1024 * 1024;

export const app = new PIXI.Application({
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: 0xffffff,
  powerPreference: "high-performance",
});
app.stageWidth = BASE_WIDTH;
app.stageHeight = BASE_HEIGHT;

export function resizeCanvas() {
  if (!wrapper) return;

  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;

  app.renderer.resize(w, h);

  const scale = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);

  app.stage.scale.set(scale);

  app.stage.x = w / 2;
  app.stage.y = h / 2;
}
resizeCanvas();

stageContainer.appendChild(app.view);

export let penGraphics;
function createPenGraphics() {
  if (penGraphics && !penGraphics._destroyed) return;
  penGraphics = new PIXI.Graphics();
  penGraphics.clear();
  app.stage.addChildAt(penGraphics, 0);
}
createPenGraphics();

export let projectVariables = {};
export let activeSprite = null;

Blockly.blockRendering.register("custom_zelos", CustomRenderer);

let renderer = localStorage.getItem("renderer");
if (!renderer) {
  localStorage.setItem("renderer", "custom_zelos");
  renderer = "custom_zelos";
}

const blocklyDiv = document.getElementById("blocklyDiv");
const toolbox = document.getElementById("toolbox");
export const workspace = Blockly.inject(blocklyDiv, {
  toolbox: toolbox,
  scrollbars: true,
  trashcan: true,
  renderer,
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.9,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2,
  },
  plugins: {
    connectionChecker: "CustomChecker",
  },
});

const observer = new ResizeObserver(() => {
  Blockly.svgResize(workspace);
});

observer.observe(blocklyDiv);

setupThemeButton(workspace);

workspace.registerToolboxCategoryCallback("GLOBAL_VARIABLES", function (_) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement("button");
  button.setAttribute("text", "Create variable");
  button.setAttribute("callbackKey", "ADD_GLOBAL_VARIABLE");
  xmlList.push(button);

  if (Object.keys(projectVariables).length === 0) return xmlList;

  const valueShadow = Blockly.utils.xml.createElement("value");
  valueShadow.setAttribute("name", "VALUE");
  const shadow = Blockly.utils.xml.createElement("shadow");
  shadow.setAttribute("type", "math_number");
  const field = Blockly.utils.xml.createElement("field");
  field.setAttribute("name", "NUM");
  field.textContent = "0";
  shadow.appendChild(field);
  valueShadow.appendChild(shadow);

  const set = Blockly.utils.xml.createElement("block");
  set.setAttribute("type", "set_global_var");
  set.appendChild(valueShadow.cloneNode(true));
  xmlList.push(set);

  const change = Blockly.utils.xml.createElement("block");
  change.setAttribute("type", "change_global_var");
  change.appendChild(valueShadow);
  xmlList.push(change);

  for (const name in projectVariables) {
    const get = Blockly.utils.xml.createElement("block");
    get.setAttribute("type", "get_global_var");
    const varField = Blockly.utils.xml.createElement("field");
    varField.setAttribute("name", "VAR");
    varField.textContent = name;
    get.appendChild(varField);
    xmlList.push(get);
  }

  return xmlList;
});

function isValidIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function makeUniqueName(base) {
  let name = base;
  let count = 0;

  while (
    name in projectVariables ||
    config.reservedWords.all.has(name)
  ) {
    count++;
    name = `${base}${count}`;
  }

  return name;
}

function addGlobalVariable(name, emit = false) {
  if (!name) name = prompt("New variable name:");
  if (!name) return;

  name = name.trim();

  if (!isValidIdentifier(name)) {
    alert("Invalid variable name");
    return;
  }

  const finalName = makeUniqueName(name);
  projectVariables[finalName] = 0;

  if (emit && currentSocket && currentRoom) {
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "addVariable",
      data: finalName,
    });
  }
}

workspace.registerButtonCallback("ADD_GLOBAL_VARIABLE", () =>
  addGlobalVariable(null, true),
);

function dynamicFunctionsCategory(workspace) {
  const xmlList = [];

  const block = document.createElement("block");
  block.setAttribute("type", "functions_definition");
  xmlList.push(block);

  const blockReturnValue = document.createElement("value");
  blockReturnValue.setAttribute("name", "VALUE");
  blockReturnValue.innerHTML =
    '<shadow type="text"><field name="TEXT">name</field></shadow>';

  const blockReturn = document.createElement("block");
  blockReturn.setAttribute("type", "functions_return");
  blockReturn.appendChild(blockReturnValue);
  xmlList.push(blockReturn);

  const sep = document.createElement("sep");
  sep.setAttribute("gap", "50");
  xmlList.push(sep);

  const defs = workspace
    .getTopBlocks(false)
    .filter(b => b.type === "functions_definition");

  defs.forEach(defBlock => {
    const block = document.createElement("block");
    block.setAttribute("type", "functions_call");

    const mutation = document.createElement("mutation");
    mutation.setAttribute("functionId", defBlock.functionId_);
    mutation.setAttribute("shape", defBlock.blockShape_);
    mutation.setAttribute("items", defBlock.argTypes_.length);
    mutation.setAttribute("returntypes", JSON.stringify(defBlock.returnTypes_ || []));

    for (let i = 0; i < defBlock.argTypes_.length; i++) {
      const item = document.createElement("item");
      item.setAttribute("type", defBlock.argTypes_[i]);
      item.setAttribute("name", defBlock.argNames_[i]);
      mutation.appendChild(item);
    }

    block.appendChild(mutation);
    xmlList.push(block);
  });

  return xmlList;
}

workspace.registerToolboxCategoryCallback("FUNCTIONS_CATEGORY", dynamicFunctionsCategory);

export const spriteManager = new SpriteManager(app);

function addSprite(id, emit = false) {
  const texture = PIXI.Texture.from("./icons/ddededodediamante.png", {
    crossorigin: true,
  });

  const sprite = spriteManager.create({
    id,
    costumes: [new Costume({ name: "default", texture })],
  });

  if (emit && currentSocket && currentRoom) {
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "addSprite",
      data: sprite.id,
    });
  }

  return sprite;
}

function deleteSprite(id, emit = false) {
  const sprite = spriteManager.get(id);
  if (!sprite) return;

  if (sprite.currentBubble) {
    app.stage.removeChild(sprite.currentBubble);
    sprite.currentBubble = null;
  }

  spriteManager.remove(sprite);

  if (emit && currentSocket && currentRoom) {
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "removeSprite",
      data: id,
    });
  }

  workspace.clear();

  const remaining = spriteManager.getOriginals();
  setActiveSprite(remaining[0] ?? null);
}

function setActiveSprite(sprite) {
  activeSprite = sprite;
  renderSpritesList(true);

  const workspaceContainer = workspace.getParentSvg().parentNode;

  if (!sprite) {
    deleteSpriteButton.disabled = true;
    workspaceContainer.style.display = "none";
    return;
  } else {
    deleteSpriteButton.disabled = false;
    workspaceContainer.style.display = "";
  }

  Blockly.Events.disable();

  const xmlText =
    activeSprite.code || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
  const xmlDom = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.clearWorkspaceAndLoadFromXml(xmlDom, workspace);

  Blockly.Events.enable();
}

function renderSpritesList(renderOthers = false) {
  const listEl = document.getElementById("sprites-list");
  listEl.innerHTML = "";

  const sprites = spriteManager.getOriginals();

  listEl.style.display = sprites.length === 0 ? "none" : "";

  sprites.forEach(sprite => {
    const spriteIconContainer = document.createElement("div");

    if (activeSprite?.id === sprite.id) {
      spriteIconContainer.className = "active";
    }

    const img = new Image(50, 50);
    img.style.objectFit = "contain";

    const baseTex = sprite.pixiSprite.texture.baseTexture;

    if (baseTex.valid) {
      img.src = baseTex.resource?.url || "";
    } else {
      baseTex.once("loaded", () => {
        img.src = baseTex.resource?.url || "";
      });
    }

    spriteIconContainer.appendChild(img);
    spriteIconContainer.onclick = () => setActiveSprite(sprite);
    listEl.appendChild(spriteIconContainer);
  });

  if (renderOthers === true) {
    renderSpriteInfo();
    renderCostumesList();
    renderSoundsList();
  }
}

function renderSpriteInfo() {
  const infoEl = document.getElementById("sprite-info");
  infoEl.innerHTML = "";

  if (!activeSprite) {
    infoEl.innerHTML = "<p>Select a sprite to see its properties.</p>";
    return;
  }

  const sprite = activeSprite.pixiSprite;

  const nameRow = document.createElement("div");
  nameRow.className = "name";

  const nameEl = createRenameableLabel(
    activeSprite.name ?? "Sprite",
    newName => {
      activeSprite.name = newName;
    }
  );

  nameRow.appendChild(nameEl);

  const infoRow = document.createElement("div");
  infoRow.className = "info";

  infoRow.innerHTML = `
    <p>${Math.round(sprite.x)}, ${Math.round(-sprite.y)}</p>
    <p>${Math.round(sprite.angle)}º</p>
    <p>size: ${Math.round(((sprite.scale.x + sprite.scale.y) / 2) * 100)}</p>
    <p><i class="fa-solid fa-${sprite.visible ? "eye" : "eye-slash"}"></i></p>
  `;

  infoEl.appendChild(nameRow);
  infoEl.appendChild(infoRow);
}

function createRenameableLabel(initialName, onRename) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";

  const nameLabel = document.createElement("p");
  nameLabel.textContent = initialName;
  nameLabel.style.margin = "0";
  nameLabel.style.cursor = "pointer";

  function startRename() {
    let willRename = true;

    const input = document.createElement("input");
    input.type = "text";
    input.value = nameLabel.textContent;
    input.style.flexGrow = "1";

    container.replaceChild(input, nameLabel);
    input.focus();
    input.select();

    function commit() {
      if (willRename) {
        const newName = input.value.trim();
        if (newName && newName !== nameLabel.textContent) {
          onRename(newName);
          nameLabel.textContent = newName;
        }
      }
      container.replaceChild(nameLabel, input);
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") input.blur();
      else if (e.key === "Escape") {
        willRename = false;
        input.blur();
      }
    });
  }

  nameLabel.addEventListener("click", startRename);
  container.appendChild(nameLabel);

  return container;
}

function createDeleteButton(onDelete) {
  const img = document.createElement("img");
  img.src = "icons/trash.svg";
  img.className = "button";
  img.draggable = false;
  img.onclick = onDelete;
  return img;
}

function renderCostumesList() {
  costumesList.innerHTML = "";

  if (!activeSprite || !activeSprite.costumes) return;

  activeSprite.costumes.forEach((costume, index) => {
    const costumeContainer = document.createElement("div");
    costumeContainer.className = "costume-container";

    const img = new Image(60, 60);
    img.style.objectFit = "contain";
    img.src = costume.texture.baseTexture.resource.url;

    const renameableLabel = createRenameableLabel(costume.name, newName => {
      const oldName = costume.name;
      costume.name = newName;

      if (currentSocket && currentRoom) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "renameCostume",
          data: {
            spriteId: activeSprite.id,
            oldName,
            newName,
          },
        });
      }
    });

    const _texture = costume.texture.baseTexture || costume.texture;
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "smallLabel";
    sizeLabel.textContent = "Loading...";
    if (_texture.valid) {
      sizeLabel.textContent = `${_texture.width}x${_texture.height}`;
    } else {
      _texture.once("update", () => {
        sizeLabel.textContent = `${_texture.width}x${_texture.height}`;
      });
    }

    const deleteBtn = createDeleteButton(() => {
      const deleted = activeSprite.costumes[index];
      activeSprite.costumes.splice(index, 1);
      if (activeSprite.costumes.length > 0) {
        activeSprite.pixiSprite.texture = activeSprite.costumes[0].texture;
      } else {
        activeSprite.pixiSprite.texture = PIXI.Texture.EMPTY;
      }
      renderCostumesList();

      if (currentSocket && currentRoom && deleted) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "deleteCostume",
          data: {
            spriteId: activeSprite.id,
            name: deleted.name,
          },
        });
      }
    });

    costumeContainer.appendChild(img);
    costumeContainer.appendChild(renameableLabel);
    costumeContainer.appendChild(deleteBtn);
    costumeContainer.appendChild(sizeLabel);

    costumesList.appendChild(costumeContainer);
  });
}

function renderSoundsList() {
  const soundsList = document.getElementById("sounds-list");
  soundsList.innerHTML = "";

  if (!activeSprite || !activeSprite.sounds) return;

  activeSprite.sounds.forEach((sound, index) => {
    const container = document.createElement("div");
    container.className = "sound-container";

    let sizeBytes = 0;
    if (sound.dataURL) {
      const base64Length = sound.dataURL.length - (sound.dataURL.indexOf(",") + 1);
      sizeBytes = Math.floor((base64Length * 3) / 4);
    }

    const renameableLabel = createRenameableLabel(sound.name, newName => {
      const oldName = sound.name;
      sound.name = newName;

      if (currentSocket && currentRoom) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "renameSound",
          data: {
            spriteId: activeSprite.id,
            oldName,
            newName,
          },
        });
      }
    });

    let sizeLabel;
    if (typeof sizeBytes === "number" && sizeBytes > 0) {
      sizeLabel = document.createElement("span");
      sizeLabel.className = "smallLabel";

      const sizeKB = sizeBytes / 1024;
      if (sizeKB < 1024) {
        sizeLabel.textContent = `${sizeKB.toFixed(2)} KB`;
      } else {
        sizeLabel.textContent = `${(sizeKB / 1024).toFixed(2)} MB`;
      }
    }

    const playButton = document.createElement("img");
    playButton.src = "icons/play.svg";
    playButton.className = "button";
    playButton.draggable = false;
    playButton.onclick = () => {
      if (playButton.audio) {
        playButton.audio.pause();
        playButton.audio.currentTime = 0;
        playButton.src = "icons/play.svg";
        playButton.audio = null;
      } else {
        const audio = new Audio(sound.dataURL);
        playButton.audio = audio;
        playButton.src = "icons/stopAudio.svg";

        audio.addEventListener("ended", () => {
          if (playButton.audio === audio) {
            playButton.src = "icons/play.svg";
            playButton.audio = null;
          }
        });

        audio.play();
      }
    };

    const deleteBtn = createDeleteButton(() => {
      activeSprite.sounds.splice(index, 1);

      if (playButton.audio) {
        playButton.audio.pause();
        playButton.audio.currentTime = 0;
        playButton.audio = null;
      }
      renderSoundsList();

      if (currentSocket && currentRoom) {
        currentSocket.emit("projectUpdate", {
          roomId: currentRoom,
          type: "deleteSound",
          data: {
            spriteId: activeSprite.id,
            name: deleted.name,
          },
        });
      }
    });

    container.appendChild(renameableLabel);
    container.appendChild(playButton);
    container.appendChild(deleteBtn);
    if (sizeLabel) container.appendChild(sizeLabel);
    soundsList.appendChild(container);
  });
}

export function calculateBubblePosition(
  sprite,
  bubbleWidth,
  bubbleHeight,
  tailHeight = 15,
) {
  let bubbleX = sprite.x - bubbleWidth / 2;
  let bubbleY = sprite.y - sprite.height / 2 - bubbleHeight - tailHeight;

  bubbleX = Math.max(
    Math.min(bubbleX, app.stageWidth / 2),
    -app.stageWidth / 2 - bubbleWidth,
  );
  bubbleY = Math.max(
    Math.min(bubbleY, app.stageHeight / 2 - bubbleHeight),
    -app.stageHeight / 2,
  );

  return { x: bubbleX, y: bubbleY };
}

export const vm = new VM();

export const keysPressed = {};
export const mouseButtonsPressed = {};
export const playingSounds = new Map();

let currentRunController = null;

export const eventRegistry = {
  flag: [],
  clone: [],
  key: new Map(),
  stageClick: [],
  timer: [],
  interval: [],
  custom: new Map(),
};

let _activeEventThreadsCount = 0;
const activeEventThreads = {};

Object.defineProperty(activeEventThreads, "count", {
  get() {
    return _activeEventThreadsCount;
  },
  set(value) {
    _activeEventThreadsCount = Math.max(0, value);
    updateRunButtonState();
  },
});

function updateRunButtonState() {
  if (runningScripts.length > 0 || activeEventThreads.count > 0) {
    runButton.classList.add("active");
  } else {
    runButton.classList.remove("active");
  }
}

export const runningScripts = [];

function stopAllScripts() {
  vm.stopAll();
  accumulator = 0;

  if (currentRunController) {
    currentRunController.abort();
    currentRunController = null;
  }

  runningScripts.forEach(script => {
    if (script.type === "timeout") clearTimeout(script.id);
    else if (script.type === "interval") clearInterval(script.id);
    else if (script.type === "raf") cancelAnimationFrame(script.id);
  });
  runningScripts.length = 0;

  for (const spriteSounds of playingSounds.values()) {
    for (const audio of spriteSounds.values()) {
      audio.pause();
      audio.src = "";
      audio.load();
    }
  }
  playingSounds.clear();

  for (const k in keysPressed) delete keysPressed[k];
  for (const k in mouseButtonsPressed) delete mouseButtonsPressed[k];

  Object.values(eventRegistry).forEach(registry => {
    if (registry instanceof Map) registry.clear();
    else if (Array.isArray(registry)) registry.length = 0;
  });

  spriteManager.getOriginals().forEach(sprite => {
    sprite.clones.forEach(clone => {
      spriteManager.remove(clone);
    });

    if (sprite.currentBubble) {
      sprite.currentBubble.destroy({ children: true });
      sprite.currentBubble = null;
    }
    if (sprite.sayTimeout) {
      clearTimeout(sprite.sayTimeout);
      sprite.sayTimeout = null;
    }
  });

  activeEventThreads.count = 0;

  updateRunButtonState();
}

async function runCode() {
  stopAllScripts();
  await new Promise(r => requestAnimationFrame(r));

  runButton.classList.add("active");

  const controller = new AbortController();
  const signal = controller.signal;
  currentRunController = controller;

  let projectStartedTime = Date.now();

  try {
    for (const spriteData of spriteManager.getOriginals()) {
      const tempWorkspace = new Blockly.Workspace({
        readOnly: true,
        plugins: {
          connectionChecker: "CustomChecker",
        },
      });

      const xmlDom = Blockly.utils.xml.textToDom(spriteData.code || "<xml></xml>");
      Blockly.Xml.domToWorkspace(xmlDom, tempWorkspace);

      const code = BlocklyJS.javascriptGenerator.workspaceToCode(tempWorkspace);
      tempWorkspace.dispose();

      runCodeWithFunctions({
        code,
        projectStartedTime,
        spriteData,
        signal
      });
    }

    eventRegistry.flag.forEach(entry => entry.trigger());

    for (const entry of eventRegistry.timer) {
      const id = setTimeout(() => entry.trigger(), entry.value * 1000);
      runningScripts.push({ type: "timeout", id });
    }

    for (const entry of eventRegistry.interval) {
      const id = setInterval(() => entry.trigger(), entry.seconds * 1000);
      runningScripts.push({ type: "interval", id });
    }

  } catch (err) {
    console.error("Error running project:", err);
    stopAllScripts();
  }
}

let accumulator = 0;
const FPS_LIMIT = 60;
const STEP_TIME = 1000 / FPS_LIMIT; // ~16.67ms

app.ticker.add(() => {
  if (!currentRunController || currentRunController.signal.aborted) return;

  accumulator += app.ticker.deltaMS;

  while (accumulator >= STEP_TIME) {
    vm.step();
    accumulator -= STEP_TIME;
  }

  updateRunButtonState();
});

app.view.addEventListener("click", () => {
  for (const entry of eventRegistry.stageClick) {
    entry.trigger();
  }
});

const allowedKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "Enter",
  "Escape",
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
]);
window.addEventListener("keydown", e => {
  const key = e.key;
  if (!allowedKeys.has(key)) return;

  keysPressed[key] = true;

  if (eventRegistry.key.has("any")) {
    eventRegistry.key.get("any").forEach(entry => entry.trigger());
  }

  if (eventRegistry.key.has(key)) {
    eventRegistry.key.get(key).forEach(entry => entry.trigger());
  }
});

window.addEventListener("keyup", e => {
  delete keysPressed[e.key];
});

window.addEventListener("blur", () => {
  for (const key in keysPressed) {
    delete keysPressed[key];
  }
});

window.addEventListener("mousedown", e => {
  mouseButtonsPressed[e.button] = true;
});
window.addEventListener("mouseup", e => {
  mouseButtonsPressed[e.button] = false;
});

document.getElementById("add-sprite-button").addEventListener("click", () => {
  let spriteData = addSprite(null, true);
  setActiveSprite(spriteData);
});

deleteSpriteButton.addEventListener("click", () => deleteSprite(activeSprite.id, true));

runButton.addEventListener("click", runCode);
document.getElementById("stop-button").addEventListener("click", stopAllScripts);

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    if (tab !== "sounds") {
      document.querySelectorAll("#sounds-list .button").forEach(i => {
        if (i.audio) {
          i.audio.pause();
          i.audio.currentTime = 0;
          i.audio = null;
          i.src = "icons/play.svg";
        }
      });
    }

    tabButtons.forEach(i => {
      i.classList.add("inactive");
    });

    button.classList.remove("inactive");

    tabContents.forEach(content => {
      content.classList.toggle("active", content.id === `${tab}-tab`);
    });

    if (tab === "code") {
      setTimeout(() => Blockly.svgResize(workspace), 0);
    } else if (tab === "costumes") {
      renderCostumesList();
    } else if (tab === "sounds") {
      renderSoundsList();
    }
  });
});

export async function getProject() {
  return {
    sprites: spriteManager.toJSON(),
    extensions: activeExtensions,
    variables: projectVariables ?? {},
  };
}

async function saveProject() {
  const zip = new JSZip();
  const json = {
    sprites: [],
    extensions: activeExtensions,
    variables: projectVariables ?? {},
  };

  const toUint8Array = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  await Promise.all(
    spriteManager.getOriginals().map(async sprite => {
      const baseJSON = sprite.toJSON();
      const spriteId = sprite.id;

      const costumeEntries = (
        await Promise.all(
          sprite.costumes.map(async c => {
            let dataURL;
            const url = c.texture?.baseTexture?.resource?.url;

            if (typeof url === "string" && url.startsWith("data:")) {
              dataURL = url;
            } else {
              dataURL = await app.renderer.extract.base64(new PIXI.Sprite(c.texture));
            }

            const processed = await compressImage(dataURL);
            if (!processed) return null;

            const base64 = processed.split(",")[1];
            zip.file(`${spriteId}.c.${c.name}.webp`, toUint8Array(base64), {
              binary: true,
            });

            return {
              name: c.name,
              texture: `${spriteId}.c.${c.name}.webp`,
            };
          }),
        )
      ).filter(Boolean);

      const soundEntries = (
        await Promise.all(
          sprite.sounds.map(async s => {
            const processed = await compressAudio(s.dataURL);
            if (!processed) return null;

            const base64 = processed.split(",")[1];
            zip.file(`${spriteId}.s.${s.name}.ogg`, toUint8Array(base64), {
              binary: true,
            });

            return {
              name: s.name,
              path: `${spriteId}.s.${s.name}.ogg`,
            };
          }),
        )
      ).filter(Boolean);

      json.sprites.push({
        ...baseJSON,
        costumes: costumeEntries,
        sounds: soundEntries,
      });
    }),
  );

  zip.file("project.json", JSON.stringify(json));

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "project.rarryz";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function loadProject(ev) {
  const [file] = ev.target.files ?? [];
  if (!file) return;
  if (file.name.endsWith(".rarry")) return oldLoadProject(ev);

  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const projectFile = zip.file("project.json");
  if (!projectFile) {
    return alert("project.rarryz missing project.json");
  }
  const json = JSON.parse(await projectFile.async("string"));

  if (!Array.isArray(json.sprites)) {
    return alert("No valid sprites found in project.");
  }

  const sprites = [];

  for (const entry of json.sprites) {
    const sprite = { ...entry };
    sprite.costumes = [];
    sprite.sounds = [];

    if (Array.isArray(entry.costumes)) {
      for (const c of entry.costumes) {
        const srcCandidate = c.texture ?? c.path ?? c.data;
        if (typeof srcCandidate === "string" && srcCandidate.startsWith("data:")) {
          sprite.costumes.push({ name: c.name, texture: srcCandidate });
          continue;
        }

        if (typeof srcCandidate === "string") {
          const fileEntry = zip.file(srcCandidate);
          if (!fileEntry) {
            throw new Error(`Missing costume file in archive: ${srcCandidate}`);
          }
          const base64 = await fileEntry.async("base64");
          const dataUrl = `data:image/webp;base64,${base64}`;
          sprite.costumes.push({ name: c.name, texture: dataUrl });
          continue;
        }

        throw new Error(
          `Invalid costume entry for sprite ${entry.id ?? "<unknown>"}: ${JSON.stringify(c)}`,
        );
      }
    }

    if (Array.isArray(entry.sounds)) {
      for (const s of entry.sounds) {
        const srcCandidate = s.data ?? s.path;
        if (typeof srcCandidate === "string" && srcCandidate.startsWith("data:")) {
          sprite.sounds.push({ name: s.name, data: srcCandidate });
          continue;
        }
        if (typeof srcCandidate === "string") {
          const fileEntry = zip.file(srcCandidate);
          if (!fileEntry) {
            throw new Error(`Missing sound file in archive: ${srcCandidate}`);
          }
          const base64 = await fileEntry.async("base64");
          const dataUrl = `data:audio/ogg;base64,${base64}`;
          sprite.sounds.push({ name: s.name, data: dataUrl });
          continue;
        }
        throw new Error(
          `Invalid sound entry for sprite ${entry.id ?? "<unknown>"}: ${JSON.stringify(s)}`,
        );
      }
    }

    sprite.code = entry.code ?? "";
    sprite.x = entry.x ?? entry.data?.x ?? 0;
    sprite.y = entry.y ?? entry.data?.y ?? 0;
    sprite.scale = entry.scale ?? entry.data?.scale?.x ?? 1;
    sprite.rotation = entry.rotation ?? entry.data?.angle ?? entry.data?.rotation ?? 0;
    sprite.currentCostume = entry.currentCostume ?? entry.data?.currentCostume ?? 0;

    sprites.push(sprite);
  }

  handleProjectData({
    sprites,
    extensions: json.extensions,
    variables: json.variables,
  });
}

async function oldLoadProject(input) {
  if (typeof input === "object" && !input.target) {
    return await handleProjectData(input);
  }
  if (typeof input === "string") {
    try {
      const data = JSON.parse(input);
      return await handleProjectData(data);
    } catch (err) {
      console.error("Invalid JSON string passed to loadProject:", err);
      return alert("Invalid JSON string provided.");
    }
  }

  const file = input?.target?.files?.[0];
  if (!file) return;

  stopAllScripts();

  const reader = new FileReader();
  reader.onload = async () => {
    input.target.value = "";

    const buffer = reader.result;

    let data;
    try {
      const text = new TextDecoder().decode(buffer);
      data = JSON.parse(text);
    } catch {
      try {
        const inflated = pako.inflate(new Uint8Array(buffer));
        const json = new TextDecoder().decode(inflated);
        data = JSON.parse(json);
      } catch (err) {
        console.error("Failed to parse file", err);
        return alert("Invalid or corrupted project file.");
      }
    }

    await handleProjectData(data);
  };
  reader.readAsArrayBuffer(file);
}

async function handleProjectData(data) {
  if (!data || typeof data !== "object") {
    console.error("Invalid project data:", data);
    alert("Invalid project data.");
    return;
  }

  if (!data.sprites && !data.extensions) {
    data = { sprites: data, extensions: [] };
  }

  try {
    if (data.extensions) {
      const toLoad = data.extensions.filter(
        e => !activeExtensions.some(a => (a?.id || a) === (e?.id || e)),
      );

      for (const ext of toLoad) {
        try {
          if (typeof ext === "string") addExtension(ext);
          else if (ext?.id) {
            const Cls = await eval("(" + ext.code + ")");
            if (Cls) await registerExtension(Cls);
          }
        } catch (err) {
          console.error("Failed to load extension", ext, err);
        }
      }
    }

    if (!Array.isArray(data.sprites)) {
      alert("No valid sprites found in project.");
      return;
    }

    spriteManager.clear();

    data.sprites.forEach(Sprite.assertValidSprite);

    if (data.variables) projectVariables = data.variables;
    createPenGraphics();

    spriteManager.fromJSON(data.sprites);

    setActiveSprite(spriteManager.getOriginals()[0] ?? null);
  } catch (err) {
    console.error("Failed to load project:", err);
    alert(err.message || "Something went wrong while loading the project.");
  }
}

document.getElementById("save-button").addEventListener("click", saveProject);

loadButton.addEventListener("click", () => {
  loadInput.click();
});
loadInput.addEventListener("change", loadProject);

document.getElementById("costume-upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file || !activeSprite) return;

  const reader = new FileReader();
  reader.onload = () => {
    const texture = PIXI.Texture.from(reader.result);

    let baseName = file.name.split(".")[0];
    let uniqueName = baseName;
    let counter = 1;

    const nameExists = name => activeSprite.costumes.some(c => c.name === name);

    while (nameExists(uniqueName)) {
      counter++;
      uniqueName = `${baseName}_${counter}`;
    }

    activeSprite.costumes.push(new Costume({ name: uniqueName, texture }));

    if (activeSprite.pixiSprite.texture === PIXI.Texture.EMPTY) {
      activeSprite.pixiSprite.texture = activeSprite.costumes[0].texture;
    }

    if (currentSocket && currentRoom) {
      currentSocket.emit("projectUpdate", {
        roomId: currentRoom,
        type: "addCostume",
        data: {
          spriteId: activeSprite.id,
          name: uniqueName,
          texture: reader.result,
        },
      });
    }

    if (document.getElementById("costumes-tab").classList.contains("active")) {
      tabButtons.forEach(button => {
        if (button.dataset.tab === "costumes") button.click();
      });
    }
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

document.getElementById("sound-upload").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file || !activeSprite) return;

  const reader = new FileReader();
  reader.onload = async () => {
    let dataURL = reader.result;
    dataURL = await compressAudio(dataURL);

    if (currentSocket && currentRoom) {
      const base64 = dataURL.substring(dataURL.indexOf(",") + 1);
      const estimatedBytes = base64.length * 0.75;
      if (estimatedBytes >= MAX_HTTP_BUFFER) {
        showNotification({
          message:
            "❌ This audio file may be too large to upload. Try compressing it to avoid this.",
        });
        e.target.value = "";
        return;
      }
    }

    let baseName = file.name.split(".")[0];
    let uniqueName = baseName;
    let counter = 1;

    const nameExists = name => activeSprite.sounds.some(s => s.name === name);

    while (nameExists(uniqueName)) {
      counter++;
      uniqueName = `${baseName}_${counter}`;
    }

    activeSprite.sounds.push({
      name: uniqueName,
      dataURL,
    });

    if (currentSocket && currentRoom) {
      currentSocket.emit("projectUpdate", {
        roomId: currentRoom,
        type: "addSound",
        data: {
          spriteId: activeSprite.id,
          name: uniqueName,
          dataURL,
        },
      });
    }

    if (document.getElementById("sounds-tab").classList.contains("active")) {
      renderSoundsList();
    }
  };

  reader.readAsDataURL(file);
  e.target.value = "";
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

function isXmlEmpty(input = "") {
  input = input.trim();
  return (
    input === '<xml xmlns="https://developers.google.com/blockly/xml"></xml>' ||
    input === ""
  );
}

window.addEventListener("beforeunload", e => {
  if (spriteManager.getOriginals().some(s => !isXmlEmpty(s.code))) {
    e.preventDefault();
    e.returnValue = "";
    if (currentSocket) currentSocket?.disconnect?.();
  }
});

SpriteChangeEvents.on("scaleChanged", sprite => {
  if (activeSprite?.pixiSprite === sprite) renderSpriteInfo();
});

SpriteChangeEvents.on("positionChanged", sprite => {
  if (activeSprite?.pixiSprite === sprite) renderSpriteInfo();

  const spriteData = spriteManager.getAll().find(s => s?.pixiSprite === sprite);
  if (!spriteData) return;

  if (spriteData.currentBubble) {
    const { width, height } = spriteData.currentBubble;
    const pos = calculateBubblePosition(sprite, width, height);
    Object.assign(spriteData.currentBubble, pos);
  }

  const { x, y } = sprite;
  const [x0, y0] = spriteData.lastPos || [x, y];

  if (spriteData.penDown) {
    penGraphics.lineStyle(spriteData.penSize || 1, spriteData.penColor);
    penGraphics.moveTo(x0, y0);
    penGraphics.lineTo(x, y);
  }

  spriteData.lastPos = [x, y];
});

SpriteChangeEvents.on("textureChanged", event => {
  renderSpritesList(false);
});

/* setup extensions stuff */

export const activeExtensions = [];

const extensionsPopup = document.querySelector(".extensions-popup");
const extensionsList = document.querySelector(".extensions-list");

function addExtensionButton() {
  const toolboxDiv = document.querySelector(
    "div.blocklyToolbox div.blocklyToolboxCategoryGroup",
  );
  if (!toolboxDiv || !extensionsPopup) return;

  const button = document.createElement("button");
  button.innerHTML = '<i class="fa-solid fa-plus stay"></i>';
  button.id = "extensionButton";

  ["pointerdown", "mousedown", "mouseup", "click"].forEach(evt =>
    button.addEventListener(evt, e => {
      e.stopPropagation();
      e.preventDefault();
    }),
  );

  button.addEventListener("click", () => {
    extensionsPopup.classList.remove("hidden");
  });

  toolboxDiv.appendChild(button);
}

function addExtension(id, emit = false) {
  if (activeExtensions.includes(id)) return;

  const extension = builtInExtensions.find(e => e?.id === id);
  if (!extension || !extension.xml) return;

  const parser = new DOMParser();
  const extDoc = parser.parseFromString(extension.xml, "text/xml");
  const coreDom = document.getElementById("toolbox");

  const category = extDoc.querySelector("category");
  coreDom.appendChild(category.cloneNode(true));

  workspace.updateToolbox(coreDom);

  activeExtensions.push(id);
  document.querySelector(`button[data-extension-id="${id}"]`).disabled = true;

  setTimeout(() => {
    extensionsPopup.classList.add("hidden");
  });

  if (emit && currentSocket && currentRoom) {
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "addExtension",
      data: id,
    });
  }
}

addExtensionButton();

builtInExtensions.forEach(e => {
  if (!e || !e.id) return;

  const extension = document.createElement("div");
  const addButton = document.createElement("button");
  addButton.onclick = () => addExtension(e.id, true);
  addButton.dataset.extensionId = e.id;
  addButton.innerText = "Add";
  extension.innerHTML = `<h2>${e?.name ?? "Extension Name"}</h2>
    <img src="./icons/${e.id}.svg">`;
  extension.appendChild(addButton);
  extensionsList.appendChild(extension);
});

const stageDiv = document.getElementById("stage-div");

fullscreenButton.addEventListener("click", () => {
  const isFull = stageDiv.classList.toggle("fullscreen");
  fullscreenButton.innerHTML = `<img src="icons/${isFull ? "smallscreen.svg" : "fullscreen.svg"
    }">`;
  resizeCanvas();
});

document.getElementById("extensions-custom-button").addEventListener("click", () => {
  const isSharing = currentSocket && currentRoom;
  showPopup({
    title: "Custom Extensions",
    rows: [
      [
        "⚠ Warning: Only use custom extensions from people you trust! Do not run custom extensions you don't know about.",
      ],
      [
        "Insert extension code:",
        {
          type: "textarea",
          placeholder: "class Extension { ... }",
          className: "extension-code-input",
        },
      ],
      [
        {
          type: "button",
          label: '<i class="fa-solid fa-plus"></i> Add',
          className: "primary",
          disabled: isSharing,
          onClick: popup => {
            const input = popup.querySelector('[data-row="1"][data-col="1"]');
            const userCode = input ? input.value : "";

            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            iframe.sandbox = "allow-scripts";
            iframe.srcdoc = `
                <script>
                  "use strict";
                  const registerExtension = (def) => {
                    parent.postMessage({ type: "registerExtension", code: def.toString() }, "*");
                  };
                  window.addEventListener("message", (event) => {
                    if (event.data && event.data.type === "runCode") {
                      try {
                        eval(event.data.code);
                      } catch (err) {
                        parent.postMessage({ type: "error", error: err.message }, "*");
                      }
                    }
                  });
                  parent.postMessage({ type: "iframeReady" }, "*");
                </script>
              `;
            document.body.appendChild(iframe);

            const handleMessage = event => {
              if (!event.data) return;

              switch (event.data.type) {
                case "registerExtension":
                  try {
                    const extensionCode = "(" + event.data.code + ")";
                    const ExtensionClass = eval(extensionCode);
                    registerExtension(ExtensionClass);

                    console.log("extension registered:", ExtensionClass);
                  } catch (error) {
                    console.error("Error in extension:", error);
                    alert("Error in extension: " + error);
                  }

                  iframe.remove();
                  window.removeEventListener("message", handleMessage);
                  break;
                case "error":
                  console.error("Error in extension:", event.data.error);
                  alert("Error in extension: " + event.data.error);
                  window.removeEventListener("message", handleMessage);
                  break;
                case "iframeReady":
                  iframe.contentWindow.postMessage(
                    { type: "runCode", code: userCode },
                    "*",
                  );
                  break;
              }
            };

            window.addEventListener("message", handleMessage);

            popup.remove();
            document.getElementById("extensions-popup")?.classList.add("hidden");
          },
        },
        isSharing
          ? "You can't add custom extensions while live sharing the project."
          : "",
      ],
    ],
  });
});

function getToken() {
  return localStorage.getItem("tooken");
}

function serializeWorkspace(workspace) {
  const xmlDom = Blockly.Xml.workspaceToDom(workspace, true);
  return Blockly.Xml.domToText(xmlDom);
}

function createSession() {
  if (currentSocket && currentSocket.connected) return currentSocket;

  currentSocket = io(`${config.apiUrl}/live`);

  currentSocket.on("connect", () => {
    console.log("connected to liveshare");
  });

  currentSocket.on("disconnect", () => {
    console.log("disconnected from liveshare");

    currentSocket = null;
    currentRoom = null;
    amHost = false;
    connectedUsers = [];

    updateUsersList();
  });

  currentSocket.on("userList", users => {
    connectedUsers = users;
    updateUsersList();
  });

  currentSocket.on("userJoined", async ({ username, socketId }) => {
    console.log(`${username} joined to room`);
    if (amHost) {
      currentSocket.emit("sendProjectData", {
        to: socketId,
        data: await getProject(),
      });
    }
    updateUsersList();
  });

  currentSocket.on("projectData", async data => {
    console.log("received project data from host");
    await handleProjectData(data);
  });

  currentSocket.on("projectUpdate", ({ type, data }) => {
    switch (type) {
      case "addVariable": {
        projectVariables[data] = 0;
        break;
      }
      case "addSprite": {
        addSprite(data, false);
        renderSpritesList(true);
        break;
      }
      case "removeSprite": {
        deleteSprite(data, false);
        renderSpritesList(true);
        break;
      }
      case "addExtension": {
        addExtension(data, false);
        break;
      }
      case "addCostume": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        const texture = PIXI.Texture.from(data.texture);
        target.costumes.push(new Costume({ name: data.name, texture }));
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "addSound": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        target.sounds.push({ name: data.name, dataURL: data.dataURL });
        if (activeSprite?.id === target.id) renderSoundsList();
        break;
      }
      case "renameCostume": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        const costume = target.costumes.find(c => c.name === data.oldName);
        if (costume) costume.name = data.newName;
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "deleteCostume": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        target.costumes = target.costumes.filter(c => c.name !== data.name);
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "renameSound": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        const sound = target.sounds.find(s => s.name === data.oldName);
        if (sound) sound.name = data.newName;
        if (activeSprite?.id === target.id) renderSoundsList();
        break;
      }
      case "deleteSound": {
        const target = spriteManager.get(data.spriteId);
        if (!target) return;
        target.sounds = target.sounds.filter(s => s.name !== data.name);
        if (activeSprite?.id === target.id) renderSoundsList();
        break;
      }
    }
  });

  currentSocket.on("blocklyUpdate", ({ spriteId, event, from }) => {
    if (from === currentSocket?.id) return;

    if (!event || typeof event !== "object") {
      console.warn("received bad blockly update (skipping):", event);
      return;
    }

    const sprite = spriteManager.get(spriteId);
    if (!sprite) return;

    let _workspace,
      temp = false;

    if (activeSprite.id === spriteId) {
      _workspace = workspace;
    } else {
      temp = true;
      _workspace = new Blockly.Workspace({
        readOnly: true,
        plugins: {
          connectionChecker: "CustomChecker",
        },
      });

      const xml = Blockly.utils.xml.textToDom(sprite.code || "<xml></xml>");
      Blockly.Xml.domToWorkspace(xml, _workspace);
    }

    Blockly.Events.disable();
    try {
      Blockly.Events.fromJson(event, _workspace).run(true);
    } catch (err) {
      console.error("blockly update error:", err, event);
    } finally {
      if (event.type === Blockly.Events.BLOCK_CHANGE && event.element === "mutation") {
        updateAllFunctionCalls(workspace);
      }

      if (temp) {
        const newXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(_workspace));
        sprite.code = newXml;

        _workspace.dispose();
      }

      Blockly.Events.enable();
    }
  });

  currentSocket.on("invitesStatus", ({ enabled }) => {
    invitesEnabled = enabled;

    const toggleInvites = document.querySelector('[data-row="1"][data-col="0"]');
    if (toggleInvites)
      toggleInvites.textContent = enabled ? "Disable Invites" : "Enable Invites";

    const copyLink = document.querySelector('[data-row="1"][data-col="1"]');
    if (copyLink) copyLink.disabled = !enabled;
  });

  currentSocket.on("kicked", () => {
    currentSocket.disconnect();
    showNotification({ message: "You were kicked from the room" });
  });

  return currentSocket;
}

function updateUsersList() {
  const container = document.getElementById("room-users");
  if (!liveShare) return;

  if (connectedUsers.length === 0) {
    liveShare.innerHTML = `
      <i class="fa-solid fa-share-from-square"></i>
      Live Share
    `;
    if (container) container.innerHTML = "<i>No users connected</i>";
    return;
  }

  if (!container) return;

  container.innerHTML = connectedUsers
    .map(u => {
      const canKick = amHost && !u.isHost;
      return `
        <div>
          <img src="${config.apiUrl}/users/${u.id}/avatar">
          <b>${u.isHost ? "👑 " : ""}${u.username}</b>
          ${canKick
          ? `<button class="kick-btn danger" data-id="${u.id}">
                  <i class="fa-solid fa-xmark"></i>
                </button>`
          : ""
        }
        </div>`;
    })
    .join("");

  liveShare.innerHTML = `
    <i class="fa-solid fa-share-from-square"></i>
    Live Share (${connectedUsers.length})
  `;

  if (amHost) {
    container.querySelectorAll(".kick-btn").forEach(btn =>
      btn.addEventListener("click", e => {
        const targetUserId = e.target.dataset.id;
        if (confirm("Kick this user?"))
          currentSocket.emit("kickUser", { roomId: currentRoom, targetUserId });
      }),
    );
  }
}

const liveShare = document.getElementById("liveshare-button");
liveShare.addEventListener("click", async () => {
  let roomExisted = currentSocket !== null && currentRoom !== null;

  function showRoomPopup() {
    const shareUrl =
      window.location.origin + window.location.pathname + `?room=${currentRoom}`;

    const invitesLabel = invitesEnabled ? "Disable Invites" : "Enable Invites";
    const buttons = [
      amHost
        ? {
          type: "button",
          label: invitesLabel,
          onClick: () => {
            const newStatus = !invitesEnabled;
            invitesEnabled = newStatus;
            currentSocket.emit("toggleInvites", {
              roomId: currentRoom,
              enabled: newStatus,
            });
          },
        }
        : invitesLabel,
      {
        type: "button",
        className: "primary",
        label: "Copy Link",
        disabled: !invitesEnabled,
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            showNotification({ message: "Copied room link!" });
          } catch (e) {
            console.error("Copy failed", e);
            alert(shareUrl);
          }
        },
      },
      {
        type: "button",
        className: "danger",
        label: amHost ? "Close room" : "Leave room",
        onClick: popup => {
          showNotification({
            message: amHost ? "Room closed" : "Left room",
          });

          popup.remove();

          currentSocket.disconnect();
          currentSocket = null;
          currentRoom = null;
          amHost = false;
        },
      },
    ];

    const rows = [
      [
        "Users:",
        {
          type: "custom",
          html: `<div id="room-users"></div>`,
        },
      ],
      buttons,
    ];

    showPopup({
      title: roomExisted ? "Current Room" : "Room Created",
      rows,
    });

    updateUsersList();
  }

  createSession();

  if (!roomExisted) {
    const token = getToken();
    if (!token) {
      showNotification({
        message: "You must be logged in to create a shared room",
      });
    } else {
      currentSocket.emit("createRoom", { token }, res => {
        if (res?.error) {
          console.error(res.error);
          showNotification({ message: `Error: ${res.error}` });
          return;
        }
        amHost = true;
        currentRoom = res.roomId;
        showRoomPopup();
      });
    }
  } else showRoomPopup();
});

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room");
if (roomId) {
  const token = getToken();
  if (!token) {
    showNotification({
      message: "You must be logged in to join a shared room",
    });
  } else {
    createSession();

    currentSocket.emit("joinRoom", { token, roomId }, res => {
      if (res?.error) {
        showNotification({ message: `Error: ${res.error}` });
        return;
      }

      currentRoom = roomId;
      amHost = false;

      console.log(`joined room ${roomId} successfully`);
    });
  }
} else {
  setActiveSprite(addSprite());
}

const ignoredEvents = new Set([
  Blockly.Events.VIEWPORT_CHANGE,
  Blockly.Events.SELECTED,
  Blockly.Events.CLICK,
  Blockly.Events.TOOLBOX_ITEM_SELECT,
  Blockly.Events.TRASHCAN_OPEN,
  Blockly.Events.FINISHED_LOADING,
  Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
  Blockly.Events.BLOCK_DRAG,
  Blockly.Events.THEME_CHANGE,
  Blockly.Events.BUBBLE_OPEN,
  "backpack_change",
]);

function sanitizeEvent(event) {
  const raw = event.toJson();
  delete raw.workspaceId;
  delete raw.recordUndo;
  return JSON.parse(JSON.stringify(raw));
}

workspace.addChangeListener(event => {
  if (!activeSprite || ignoredEvents.has(event.type)) return;

  activeSprite.code = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));

  if (currentSocket && currentRoom) {
    const json = sanitizeEvent(event);

    currentSocket.emit("blocklyUpdate", {
      roomId: currentRoom,
      spriteId: activeSprite.id,
      event: json,
    });
  }
});

workspace.addChangeListener(Blockly.Events.disableOrphans);

class TheDragger extends Blockly.dragging.Dragger {
  setDraggable(draggable) {
    this.draggable = draggable;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.BLOCK_DRAGGER,
  Blockly.registry.DEFAULT,
  TheDragger,
  true,
);

function updateAllFunctionCalls(workspace) {
  const allBlocks = workspace.getAllBlocks(false);
  const defs = allBlocks.filter(b => b.type === "functions_definition");
  const defMap = {};
  defs.forEach(def => (defMap[def.functionId_] = def));

  const calls = allBlocks.filter(b => b.type === "functions_call");

  Blockly.Events.disable();
  try {
    calls.forEach(callBlock => {
      const def = defs.find(d => d.functionId_ === callBlock.functionId_);
      if (!def) return;

      def.updateReturnState_();
      callBlock.matchDefinition(def);
    });
  } finally {
    Blockly.Events.enable();
  }
}

workspace.addChangeListener(event => {
  if (event.isUiEvent || event.isBlank) return;

  const block = workspace.getBlockById(
    event?.newParentId ?? event?.oldParentId ?? event?.blockId,
  );

  if (!block || block?.getRootBlock()?.type !== "functions_definition") return;

  updateAllFunctionCalls(workspace);
});

workspace.updateAllFunctionCalls = () => {
  updateAllFunctionCalls(workspace);
};

// tools for dev :3
if (window.location.hostname === "localhost") {
  const stageControls = document.getElementById("stage-controls");

  const devButton = document.createElement("button");
  devButton.innerHTML = '<img src="icons/dev-tools-icon.png">';
  devButton.addEventListener("click", e => {
    showPopup({
      title: "Dev Tools",
      rows: [
        [
          {
            type: "button",
            label: "Console log workspace XML",
            onClick: popup => {
              console.log(Blockly.Xml.workspaceToDom(workspace));

              popup.remove();
            },
          },
        ],
      ],
    });
  });

  stageControls.appendChild(devButton);
}
