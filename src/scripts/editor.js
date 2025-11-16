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
  promiseWithAbort,
  showNotification,
  showPopup,
} from "../functions/utils.js";

import { SpriteChangeEvents } from "../functions/patches.js";
import {
  registerExtension,
  setupExtensions,
} from "../functions/extensionManager.js";
import { Thread } from "../functions/threads.js";
import { runCodeWithFunctions } from "../functions/runCode.js";

import config from "../config";

BlocklyJS.javascriptGenerator.addReservedWords(
  "whenFlagClicked,moveSteps,getAngle,getMousePosition,sayMessage,waitOneFrame,wait,switchCostume,setSize,setAngle,projectTime,isKeyPressed,isMouseButtonPressed,getCostumeSize,getSpriteScale,_startTween,startTween,soundProperties,setSoundProperty,playSound,stopSound,stopAllSounds,isMouseTouchingSprite,setPenStatus,setPenColor,setPenColorHex,setPenSize,clearPen,Thread,fastExecution,BUBBLE_TEXTSTYLE,sprite,renderer,stage,costumeMap,soundMap,stopped,code,penGraphics,runningScripts,findOrFilterItem,registerEvent,triggerCustomEvent,hideSprite,showSprite"
);

import.meta.glob("../blocks/**/*.js", { eager: true });

Thread.resetAll();

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

const app = new PIXI.Application({
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

let penGraphics;
function createPenGraphics() {
  if (penGraphics && !penGraphics._destroyed) return;
  penGraphics = new PIXI.Graphics();
  penGraphics.clear();
  app.stage.addChildAt(penGraphics, 0);
  window.penGraphics = penGraphics;
}
createPenGraphics();

export let projectVariables = {};
export let sprites = [];
export let activeSprite = null;

Blockly.blockRendering.register("custom_zelos", CustomRenderer);

let renderer = localStorage.getItem("renderer");
if (!renderer) {
  localStorage.setItem("renderer", "custom_zelos");
  renderer = "custom_zelos";
}

const toolbox = document.getElementById("toolbox");
export const workspace = Blockly.inject("blocklyDiv", {
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
});

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

function addGlobalVariable(name, emit = false) {
  if (!name) name = prompt("New variable name:");
  if (name) {
    let newName = name,
      count = 0;
    while (newName in projectVariables) {
      count++;
      newName = name + count;
    }

    projectVariables[newName] = 0;

    if (emit && currentSocket && currentRoom)
      currentSocket.emit("projectUpdate", {
        roomId: currentRoom,
        type: "addVariable",
        data: newName,
      });
  }
}

workspace.registerButtonCallback("ADD_GLOBAL_VARIABLE", () =>
  addGlobalVariable(null, true)
);

function addSprite(id, emit = false) {
  const texture = PIXI.Texture.from("./icons/ddededodediamante.png", {
    crossorigin: true,
  });
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = 0;
  sprite.y = 0;
  sprite.scale._parentScaleEvent = sprite;
  app.stage.addChild(sprite);

  if (!id) id = "sprite-" + Date.now();

  const spriteData = {
    id,
    pixiSprite: sprite,
    code: "",
    costumes: [{ name: "default", texture: texture }],
    sounds: [],
  };
  sprites.push(spriteData);

  if (emit && currentSocket && currentRoom)
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "addSprite",
      data: id,
    });

  return spriteData;
}

function setActiveSprite(spriteData) {
  activeSprite = spriteData;
  renderSpritesList(true);

  const workspaceContainer = workspace.getParentSvg().parentNode;

  if (!spriteData) {
    deleteSpriteButton.disabled = true;
    workspaceContainer.style.display = "none";
    return;
  } else {
    deleteSpriteButton.disabled = false;
    workspaceContainer.style.display = "";
  }

  Blockly.Events.disable();

  const xmlText =
    activeSprite.code ||
    '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
  const xmlDom = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.clearWorkspaceAndLoadFromXml(xmlDom, workspace);

  Blockly.Events.enable();
}

function deleteSprite(id, emit = false) {
  const sprite = sprites.find((s) => s.id === id);
  if (!sprite) return;

  if (sprite.currentBubble) {
    app.stage.removeChild(sprite.currentBubble);
    sprite.currentBubble = null;
  }

  app.stage.removeChild(sprite.pixiSprite);

  const index = sprites.indexOf(sprite);

  if (emit && currentSocket && currentRoom)
    currentSocket.emit("projectUpdate", {
      roomId: currentRoom,
      type: "removeSprite",
      data: id,
    });

  sprites = sprites.filter((s) => s.id !== sprite.id);

  workspace.clear();

  if (sprites.length > 0) {
    setActiveSprite(sprites[Math.min(index, sprites.length - 1)]);
  } else {
    setActiveSprite(null);
  }
}

function renderSpritesList(renderOthers = false) {
  const listEl = document.getElementById("sprites-list");
  listEl.innerHTML = "";
  if (sprites.length === 0) listEl.style.display = "none";
  else listEl.style.display = "";

  sprites.forEach((spriteData) => {
    const spriteIconContainer = document.createElement("div");
    if (activeSprite && activeSprite.id === spriteData.id)
      spriteIconContainer.className = "active";

    const img = new Image(50, 50);
    img.style.objectFit = "contain";
    const costumeTexture = spriteData.pixiSprite.texture;
    const baseTex = costumeTexture.baseTexture;

    if (baseTex.valid) {
      img.src = baseTex.resource?.url || "";
    } else {
      baseTex.on("loaded", () => {
        img.src = baseTex.resource?.url || "";
      });
    }

    spriteIconContainer.appendChild(img);
    spriteIconContainer.onclick = () => setActiveSprite(spriteData);
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

  if (!activeSprite) {
    infoEl.innerHTML = "<p>Select a sprite to see its info.</p>";
  } else {
    const sprite = activeSprite.pixiSprite;

    infoEl.innerHTML = `
    <p>${Math.round(sprite.x)}, ${Math.round(-sprite.y)}</p>
    <p>${Math.round(sprite.angle)}º</p>
    <p>size: ${Math.round(((sprite.scale.x + sprite.scale.y) / 2) * 100)}</p>
    <p><i class="fa-solid fa-${sprite.visible ? "eye" : "eye-slash"}"></i></p>
    `;
  }
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
    input.addEventListener("keydown", (e) => {
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

    const renameableLabel = createRenameableLabel(costume.name, (newName) => {
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
      const base64Length =
        sound.dataURL.length - (sound.dataURL.indexOf(",") + 1);
      sizeBytes = Math.floor((base64Length * 3) / 4);
    }

    const renameableLabel = createRenameableLabel(sound.name, (newName) => {
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
  tailHeight = 15
) {
  let bubbleX = sprite.x - bubbleWidth / 2;
  let bubbleY = sprite.y - sprite.height / 2 - bubbleHeight - tailHeight;

  bubbleX = Math.max(
    Math.min(bubbleX, app.stageWidth / 2),
    -app.stageWidth / 2 - bubbleWidth
  );
  bubbleY = Math.max(
    Math.min(bubbleY, app.stageHeight / 2 - bubbleHeight),
    -app.stageHeight / 2
  );

  return { x: bubbleX, y: bubbleY };
}

const keysPressed = {};
const mouseButtonsPressed = {};
const playingSounds = new Map();

let currentRunController = null;

let eventRegistry = {
  flag: [],
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

const runningScripts = [];

function stopAllScripts() {
  if (currentRunController) {
    try {
      currentRunController.abort();
    } catch (e) {}
    currentRunController = null;
  }

  for (const i of runningScripts) {
    if (i.type === "timeout") clearTimeout(i.id);
    else if (i.type === "interval") clearInterval(i.id);
    else if (i.type === "raf") cancelAnimationFrame(i.id);
  }
  runningScripts.length = 0;

  for (const spriteSounds of playingSounds.values()) {
    for (const audio of spriteSounds.values()) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    }
  }
  playingSounds.clear();

  for (const k in keysPressed) delete keysPressed[k];
  for (const k in mouseButtonsPressed) delete mouseButtonsPressed[k];

  for (const type in eventRegistry) {
    if (Array.isArray(eventRegistry[type])) {
      eventRegistry[type].length = 0;
    } else if (eventRegistry[type] instanceof Map) {
      eventRegistry[type].clear();
    }
  }

  Thread.resetAll();
  activeEventThreads.count = 0;

  for (const spriteData of sprites) {
    const bubble = spriteData.currentBubble;
    if (bubble) {
      if (bubble.destroy) bubble.destroy({ children: true });
      spriteData.currentBubble = null;
    }

    if (spriteData.sayTimeout) {
      clearTimeout(spriteData.sayTimeout);
      spriteData.sayTimeout = null;
    }
  }
}

async function runCode() {
  stopAllScripts();

  await new Promise((r) => requestAnimationFrame(r));

  runButton.classList.add("active");

  const controller = new AbortController();
  const signal = controller.signal;
  currentRunController = controller;

  let projectStartedTime = Date.now();

  try {
    for (const spriteData of sprites) {
      const tempWorkspace = new Blockly.Workspace();
      BlocklyJS.javascriptGenerator.init(tempWorkspace);

      const xmlText =
        spriteData.code ||
        '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
      const xmlDom = Blockly.utils.xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(xmlDom, tempWorkspace);

      const code = BlocklyJS.javascriptGenerator.workspaceToCode(tempWorkspace);
      tempWorkspace.dispose();

      try {
        runCodeWithFunctions({
          code,
          projectStartedTime,
          spriteData,
          app,
          eventRegistry,
          mouseButtonsPressed,
          keysPressed,
          playingSounds,
          runningScripts,
          signal,
          penGraphics,
          activeEventThreads,
        });
      } catch (e) {
        console.error(`Error processing code for sprite ${spriteData.id}:`, e);
      }
    }

    const results = await Promise.allSettled(
      eventRegistry.flag.map((entry) => promiseWithAbort(entry.cb, signal))
    );

    results.forEach((res) => {
      if (res.status === "rejected" && res.reason?.message !== "shouldStop") {
        console.error("Error running flag event:", res.reason);
      }
    });

    for (const entry of eventRegistry.timer) {
      const id = setTimeout(() => entry.cb(), entry.value * 1000);
      runningScripts.push({ type: "timeout", id });
    }

    for (const entry of eventRegistry.interval) {
      const id = setInterval(() => entry.cb(), entry.seconds * 1000);
      runningScripts.push({ type: "interval", id });
    }
  } catch (err) {
    console.error("Error running project:", err);
    stopAllScripts();
  } finally {
    updateRunButtonState();
  }
}

app.view.addEventListener("click", () => {
  for (const entry of eventRegistry.stageClick) {
    entry.cb();
  }
});

document.getElementById("add-sprite-button").addEventListener("click", () => {
  let spriteData = addSprite(null, true);
  setActiveSprite(spriteData);
});

deleteSpriteButton.addEventListener("click", () =>
  deleteSprite(activeSprite.id, true)
);

runButton.addEventListener("click", runCode);
document
  .getElementById("stop-button")
  .addEventListener("click", stopAllScripts);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    if (tab !== "sounds") {
      document.querySelectorAll("#sounds-list .button").forEach((i) => {
        if (i.audio) {
          i.audio.pause();
          i.audio.currentTime = 0;
          i.audio = null;
          i.src = "icons/play.svg";
        }
      });
    }

    tabButtons.forEach((i) => {
      i.classList.add("inactive");
    });

    button.classList.remove("inactive");

    tabContents.forEach((content) => {
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
  const spritesData = await Promise.all(
    sprites.map(async (sprite) => {
      const costumesData = await Promise.all(
        sprite.costumes.map(async (c) => {
          let dataURL;
          const url = c?.texture?.baseTexture?.resource?.url;
          if (typeof url === "string" && url.startsWith("data:")) {
            dataURL = url;
          } else {
            dataURL = await app.renderer.extract.base64(
              new PIXI.Sprite(c.texture)
            );
          }
          return {
            name: c.name,
            data: dataURL,
          };
        })
      );

      return {
        id: sprite.id,
        code: sprite.code,
        costumes: costumesData,
        sounds: sprite.sounds.map((s) => ({ name: s.name, data: s.dataURL })),
        data: {
          x: sprite.pixiSprite.x,
          y: sprite.pixiSprite.y,
          scale: {
            x: sprite.pixiSprite.scale.x ?? 1,
            y: sprite.pixiSprite.scale.y ?? 1,
          },
          angle: sprite.pixiSprite.angle,
          currentCostume: sprite.costumes.findIndex(
            (c) => c.texture === sprite.pixiSprite.texture
          ),
        },
      };
    })
  );

  return {
    sprites: spritesData,
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
  const toUint8Array = (base64) =>
    Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  async function ensureWebp(dataURL) {
    if (!dataURL || typeof dataURL !== "string") return null;
    if (dataURL.startsWith("data:image/webp")) return dataURL;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/webp", 0.9));
      };
      img.src = dataURL;
    });
  }

  async function ensureOgg(dataURL) {
    if (!dataURL || typeof dataURL !== "string") return null;
    if (dataURL.startsWith("data:audio/ogg")) return dataURL;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const base64 = dataURL.split(",")[1];
    const buffer = await audioCtx.decodeAudioData(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer
    );

    if (window.MediaRecorder && MediaRecorder.isTypeSupported("audio/ogg")) {
      const stream = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(stream);
      source.start(0);

      const recorder = new MediaRecorder(stream.stream, {
        mimeType: "audio/ogg",
      });
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      return new Promise((resolve) => {
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/ogg" });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        };
        recorder.start();
        source.onended = () => recorder.stop();
      });
    } else {
      return dataURL;
    }
  }

  await Promise.all(
    sprites.map(async (sprite) => {
      const spriteId = sprite.id;

      const costumeEntries = (
        await Promise.all(
          sprite.costumes.map(async (c) => {
            let dataURL;
            const url = c?.texture?.baseTexture?.resource?.url;
            if (typeof url === "string" && url.startsWith("data:")) {
              dataURL = url;
            } else {
              dataURL = await app.renderer.extract.base64(
                new PIXI.Sprite(c.texture)
              );
            }

            const processed = await ensureWebp(dataURL);
            if (!processed) return null;

            const base64 = processed.split(",")[1];
            const binary = toUint8Array(base64);
            const fileName = `${spriteId}.c.${c.name}.webp`;
            zip.file(fileName, binary, { binary: true });
            return { name: c.name, path: fileName };
          })
        )
      ).filter(Boolean);

      const soundEntries = (
        await Promise.all(
          sprite.sounds.map(async (s) => {
            const processed = await ensureOgg(s.dataURL);
            if (!processed) return null;

            const base64 = processed.split(",")[1];
            const binary = toUint8Array(base64);
            const fileName = `${spriteId}.s.${s.name}.ogg`;
            zip.file(fileName, binary, { binary: true });
            return { name: s.name, path: fileName };
          })
        )
      ).filter(Boolean);

      json.sprites.push({
        id: spriteId,
        code: sprite.code,
        costumes: costumeEntries,
        sounds: soundEntries,
        data: sprite.data,
      });
    })
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
  const json = JSON.parse(await zip.file("project.json").async("string"));
  const sprites = [];

  for (const entry of json.sprites) {
    const sprite = { ...entry, costumes: [], sounds: [] };

    await Promise.all([
      ...(entry.costumes || []).map(async (c) => {
        const base64 = await zip.file(c.path).async("base64");
        sprite.costumes.push({
          name: c.name,
          data: `data:image/webp;base64,${base64}`,
        });
      }),
      ...(entry.sounds || []).map(async (s) => {
        const base64 = await zip.file(s.path).async("base64");
        sprite.sounds.push({
          name: s.name,
          data: `data:audio/ogg;base64,${base64}`,
        });
      }),
    ]);

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
      return window.alert("Invalid JSON string provided.");
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
        return window.alert("Invalid or corrupted project file.");
      }
    }

    await handleProjectData(data);
  };
  reader.readAsArrayBuffer(file);
}

async function handleProjectData(data) {
  if (!data || typeof data !== "object") {
    console.error("Invalid project data:", data);
    window.alert("Invalid project data.");
    return;
  }

  if (!data.sprites && !data.extensions) {
    data = { sprites: data, extensions: [] };
  }

  try {
    if (data?.extensions) {
      const extensionsToLoad = data.extensions.filter(
        (i) => !activeExtensions.some((z) => (z?.id || z) === (i?.id || i))
      );

      for (const ext of extensionsToLoad) {
        try {
          if (typeof ext === "string") {
            addExtension(ext);
          } else if (ext?.id) {
            const ExtensionClass = await eval("(" + ext.code + ")");
            if (ExtensionClass) await registerExtension(ExtensionClass);
          }
        } catch (err) {
          console.error("Failed to load extension", ext?.id || ext, err);
        }
      }
    }

    for (const child of app.stage.removeChildren()) {
      if (child.destroy) child.destroy({ children: true });
    }
    sprites = [];

    if (!Array.isArray(data.sprites)) {
      window.alert("No valid sprites found in file.");
      return;
    }

    if (data.variables) projectVariables = data.variables;
    createPenGraphics();

    data?.sprites?.forEach((entry, i) => {
      if (!entry || typeof entry !== "object") return;

      const spriteData = {
        id: entry.id || `sprite-${i}`,
        code: entry.code || "",
        costumes: [],
        sounds: [],
        data: {
          x: entry?.data?.x ?? 0,
          y: entry?.data?.y ?? 0,
          scale: {
            x: entry?.data?.scale?.x ?? 1,
            y: entry?.data?.scale?.y ?? 1,
          },
          angle: entry?.data?.angle ?? 0,
          rotation: entry?.data?.rotation ?? 0,
          currentCostume: entry?.data?.currentCostume,
        },
      };

      if (Array.isArray(entry.costumes)) {
        entry.costumes.forEach((c) => {
          if (!c?.data || !c.name) return;
          try {
            const texture = PIXI.Texture.from(c.data);
            spriteData.costumes.push({ name: c.name, texture });
          } catch (err) {
            console.warn(`Failed to load costume: ${c.name}`, err);
            const texture = PIXI.Texture.WHITE;
            spriteData.costumes.push({ name: c.name, texture });
          }
        });
      }

      if (Array.isArray(entry.sounds)) {
        entry.sounds.forEach((s) => {
          if (!s?.name || !s?.data) return;
          spriteData.sounds.push({ name: s.name, dataURL: s.data });
        });
      }

      const sprite =
        spriteData.costumes.length > 0
          ? new PIXI.Sprite(spriteData.costumes[0].texture)
          : new PIXI.Sprite();

      sprite.anchor.set(0.5);
      sprite.x = spriteData.data.x;
      sprite.y = spriteData.data.y;
      sprite.scale.x = spriteData.data.scale.x;
      sprite.scale.y = spriteData.data.scale.y;

      if (entry?.data?.angle !== null) sprite.angle = spriteData.data.angle;
      else sprite.rotation = spriteData.data.rotation;

      const cc = spriteData.data.currentCostume;
      if (typeof cc === "number" && spriteData.costumes[cc]) {
        sprite.texture = spriteData.costumes[cc].texture;
      }

      spriteData.pixiSprite = sprite;
      spriteData.pixiSprite.scale._parentScaleEvent = sprite;

      app.stage.addChild(sprite);
      sprites.push(spriteData);
    });

    setActiveSprite(sprites[0] || null);
  } catch (err) {
    console.error("Failed to load project:", err);
    window.alert("Something went wrong while loading the project.");
  }
}

document.getElementById("save-button").addEventListener("click", saveProject);

loadButton.addEventListener("click", () => {
  loadInput.click();
});
loadInput.addEventListener("change", loadProject);

document.getElementById("costume-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !activeSprite) return;

  const reader = new FileReader();
  reader.onload = () => {
    const texture = PIXI.Texture.from(reader.result);

    let baseName = file.name.split(".")[0];
    let uniqueName = baseName;
    let counter = 1;

    const nameExists = (name) =>
      activeSprite.costumes.some((c) => c.name === name);

    while (nameExists(uniqueName)) {
      counter++;
      uniqueName = `${baseName}_${counter}`;
    }

    activeSprite.costumes.push({ name: uniqueName, texture });

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
      tabButtons.forEach((button) => {
        if (button.dataset.tab === "costumes") button.click();
      });
    }
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

document
  .getElementById("sound-upload")
  .addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !activeSprite) return;

    const reader = new FileReader();
    reader.onload = async () => {
      let dataURL = reader.result;

      dataURL = await compressAudio(dataURL);

      let baseName = file.name.split(".")[0];
      let uniqueName = baseName;
      let counter = 1;

      const nameExists = (name) =>
        activeSprite.sounds.some((s) => s.name === name);

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

window.addEventListener("beforeunload", (e) => {
  if (currentSocket) currentSocket?.disconnect?.();
  if (
    sprites.length <= 1 &&
    sprites.some((sprite) => !isXmlEmpty(sprite.code))
  ) {
    e.preventDefault();
    e.returnValue = "";
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
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (allowedKeys.has(key)) {
    keysPressed[key] = true;
  }

  const specificHandlers = eventRegistry.key.get(key);
  if (specificHandlers) {
    for (const entry of specificHandlers) {
      entry.cb();
    }
  }

  const anyHandlers = eventRegistry.key.get("any");
  if (anyHandlers) {
    for (const entry of anyHandlers) {
      entry.cb(key);
    }
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key;
  if (allowedKeys.has(key)) {
    keysPressed[key] = false;
  }
});

window.addEventListener("blur", () => {
  for (const key in keysPressed) {
    keysPressed[key] = false;
  }
});

window.addEventListener("mousedown", (e) => {
  mouseButtonsPressed[e.button] = true;
});
window.addEventListener("mouseup", (e) => {
  mouseButtonsPressed[e.button] = false;
});

SpriteChangeEvents.on("scaleChanged", (sprite) => {
  if (activeSprite?.pixiSprite === sprite) renderSpriteInfo();
});

SpriteChangeEvents.on("positionChanged", (sprite) => {
  if (activeSprite?.pixiSprite === sprite) renderSpriteInfo();

  const spriteData = sprites.find((s) => s?.pixiSprite === sprite);
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

SpriteChangeEvents.on("textureChanged", (event) => {
  renderSpritesList(false);
});

/* setup extensions stuff */

export const activeExtensions = [];

const extensions = [
  {
    id: "tween",
    name: "Tween",
    xml: `<category name="Tween" colour="#32a2c0">
        <block type="tween_sprite_property">
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
          <value name="DURATION">
            <shadow type="math_number">
              <field name="NUM">3</field>
            </shadow>
          </value>
        </block>
        <block type="tween_block">
          <value name="FROM">
            <shadow type="math_number">
              <field name="NUM">0</field>
            </shadow>
          </value>
          <value name="TO">
            <shadow type="math_number">
              <field name="NUM">100</field>
            </shadow>
          </value>
          <value name="DURATION">
            <shadow type="math_number">
              <field name="NUM">3</field>
            </shadow>
          </value>
        </block>
        <block type="tween_block_value"></block>
      </category>`,
  },
  {
    id: "pen",
    name: "Pen",
    xml: `<category name="Pen" colour="#0fbd8c">
        <block type="pen_down"></block>
        <block type="pen_up"></block>
        <block type="set_pen_color_combined">
          <value name="VALUE">
            <shadow type="text">
              <field name="TEXT">255,100,100</field>
            </shadow>
          </value>
        </block>
        <block type="set_pen_size">
          <value name="SIZE"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        </block>
        <block type="clear_pen"></block>
      </category>`,
  },
  {
    id: "sets",
    name: "Sets",
    xml: `<category name="Sets" colour="#2cc2a9">
        <block type="sets_create_with">
          <mutation items="2"></mutation>
        </block>
        <sep gap="50"></sep>
        <block type="sets_has">
          <value name="VALUE">
              <shadow type="text">
                  <field name="TEXT"></field>
              </shadow>
          </value>
        </block>
        <block type="sets_add">
          <value name="VALUE">
              <shadow type="text">
                  <field name="TEXT"></field>
              </shadow>
          </value>
        </block>
        <block type="sets_delete">
          <value name="VALUE">
              <shadow type="text">
                  <field name="TEXT"></field>
              </shadow>
          </value>
        </block>
        <block type="sets_size"></block>
        <block type="sets_convert"></block>
        <block type="sets_merge"></block>
      </category>`,
  },
];

const extensionsPopup = document.querySelector(".extensions-popup");
const extensionsList = document.querySelector(".extensions-list");

function addExtensionButton() {
  const toolboxDiv = document.querySelector(
    "div.blocklyToolbox div.blocklyToolboxCategoryGroup"
  );
  if (!toolboxDiv || !extensionsPopup) return;

  const button = document.createElement("button");
  button.textContent = "➕";
  button.id = "extensionButton";

  ["pointerdown", "mousedown", "mouseup", "click"].forEach((evt) =>
    button.addEventListener(evt, (e) => {
      e.stopPropagation();
      e.preventDefault();
    })
  );

  button.addEventListener("click", () => {
    extensionsPopup.classList.remove("hidden");
  });

  toolboxDiv.appendChild(button);
}

function addExtension(id, emit = false) {
  if (activeExtensions.includes(id)) return;

  const extension = extensions.find((e) => e?.id === id);
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

  if (emit && currentSocket && currentRoom);
  currentSocket.emit("projectUpdate", {
    roomId: currentRoom,
    type: "addExtension",
    data: id,
  });
}

setupExtensions();
addExtensionButton();

extensions.forEach((e) => {
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
  fullscreenButton.innerHTML = `<img src="icons/${
    isFull ? "smallscreen.svg" : "fullscreen.svg"
  }">`;
  resizeCanvas();
});

document
  .getElementById("extensions-custom-button")
  .addEventListener("click", () => {
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
            onClick: (popup) => {
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

              const handleMessage = (event) => {
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
                      window.alert("Error in extension: " + error);
                    }

                    iframe.remove();
                    window.removeEventListener("message", handleMessage);
                    break;
                  case "error":
                    console.error("Error in extension:", event.data.error);
                    window.alert("Error in extension: " + event.data.error);
                    break;
                  case "iframeReady":
                    iframe.contentWindow.postMessage(
                      { type: "runCode", code: userCode },
                      "*"
                    );
                    break;
                }
              };

              window.addEventListener("message", handleMessage);

              popup.remove();
              document
                .getElementById("extensions-popup")
                ?.classList.add("hidden");
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

  currentSocket.on("userList", (users) => {
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

  currentSocket.on("projectData", async (data) => {
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
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        const texture = PIXI.Texture.from(data.texture);
        target.costumes.push({ name: data.name, texture });
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "addSound": {
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        target.sounds.push({ name: data.name, dataURL: data.dataURL });
        if (activeSprite?.id === target.id) renderSoundsList();
        break;
      }
      case "renameCostume": {
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        const costume = target.costumes.find((c) => c.name === data.oldName);
        if (costume) costume.name = data.newName;
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "deleteCostume": {
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        target.costumes = target.costumes.filter((c) => c.name !== data.name);
        if (activeSprite?.id === target.id) renderCostumesList();
        break;
      }
      case "renameSound": {
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        const sound = target.sounds.find((s) => s.name === data.oldName);
        if (sound) sound.name = data.newName;
        if (activeSprite?.id === target.id) renderSoundsList();
        break;
      }
      case "deleteSound": {
        const target = sprites.find((s) => s.id === data.spriteId);
        if (!target) return;
        target.sounds = target.sounds.filter((s) => s.name !== data.name);
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

    const sprite = sprites.find((s) => s.id === spriteId);
    if (!sprite) return;

    let _workspace,
      temp = false;

    if (activeSprite.id === spriteId) {
      _workspace = workspace;
    } else {
      temp = true;
      _workspace = new Blockly.Workspace();

      const xml = Blockly.utils.xml.textToDom(sprite.code || "<xml></xml>");
      Blockly.Xml.domToWorkspace(xml, _workspace);
    }

    Blockly.Events.disable();
    try {
      Blockly.Events.fromJson(event, _workspace).run(true);
    } catch (err) {
      console.error("blockly update error:", err, event);
    }
    Blockly.Events.enable();

    if (temp) {
      const newXml = Blockly.Xml.domToText(
        Blockly.Xml.workspaceToDom(_workspace)
      );
      sprite.code = newXml;

      _workspace.dispose();
    }
  });

  currentSocket.on("invitesStatus", ({ enabled }) => {
    invitesEnabled = enabled;

    const toggleInvites = document.querySelector(
      '[data-row="1"][data-col="0"]'
    );
    if (toggleInvites)
      toggleInvites.textContent = enabled
        ? "Disable Invites"
        : "Enable Invites";

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
    .map((u) => {
      const canKick = amHost && !u.isHost;
      return `
        <div>
          <img src="${config.apiUrl}/users/${u.id}/avatar">
          <b>${u.isHost ? "👑 " : ""}${u.username}</b>
          ${
            canKick
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
    container.querySelectorAll(".kick-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const targetUserId = e.target.dataset.id;
        if (confirm("Kick this user?"))
          currentSocket.emit("kickUser", { roomId: currentRoom, targetUserId });
      })
    );
  }
}

const liveShare = document.getElementById("liveshare-button");
liveShare.addEventListener("click", async () => {
  let roomExisted = currentSocket !== null && currentRoom !== null;

  function showRoomPopup() {
    const shareUrl =
      window.location.origin +
      window.location.pathname +
      `?room=${currentRoom}`;

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
            window.alert(shareUrl);
          }
        },
      },
      {
        type: "button",
        className: "danger",
        label: amHost ? "Close room" : "Leave room",
        onClick: (popup) => {
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
      currentSocket.emit("createRoom", { token }, (res) => {
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

    currentSocket.emit("joinRoom", { token, roomId }, (res) => {
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
  let spriteData = addSprite();
  setActiveSprite(spriteData);
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

workspace.addChangeListener((event) => {
  if (!activeSprite || ignoredEvents.has(event.type)) return;

  activeSprite.code = Blockly.Xml.domToText(
    Blockly.Xml.workspaceToDom(workspace)
  );

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
