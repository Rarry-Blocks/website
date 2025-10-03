import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import * as PIXI from "pixi.js";
import pako from "pako";
import { minify } from "terser";
import "@fortawesome/fontawesome-free/css/all.min.css";

import CustomRenderer from "./render.js";
import { SpriteChangeEvents } from "./patches.js";
import { runCodeWithFunctions, showPopup } from "./functions.js";
import { registerExtension } from "./extensionManager.js";
import { Thread } from "./threads.js";
import.meta.glob("../blocks/**/*.js", { eager: true });

BlocklyJS.javascriptGenerator.addReservedWords(
  `whenFlagClicked,moveSteps,changePosition,setPosition,getPosition,getAngle,
  getMousePosition,sayMessage,waitOneFrame,wait,switchCostume,setSize,setAngle,
  projectTime,isKeyPressed,isMouseButtonPressed,getCostumeSize,getSpriteScale,
  _startTween,startTween,soundProperties,getSoundProperty,setSoundProperty,
  playSound,stopSound,stopAllSounds,isMouseTouchingSprite,setPenStatus,
  setPenColor,setPenColorHex,setPenSize,clearPen`.replaceAll("\n", "")
);

const wrapper = document.getElementById("stage-wrapper");
const stageContainer = document.getElementById("stage");
const costumesList = document.getElementById("costumes-list");
const loadInput = document.getElementById("load-input");
const loadButton = document.getElementById("load-button");
const deleteSpriteButton = document.getElementById("delete-sprite-button");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const fullscreenButton = document.getElementById("fullscreen-button");
const root = document.documentElement;

const BASE_WIDTH = 480;
const BASE_HEIGHT = 360;

const app = new PIXI.Application({
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: 0xffffff,
  powerPreference: "high-performance",
});
app.stageWidth = BASE_WIDTH;
app.stageHeight = BASE_HEIGHT;

export function resizeCanvas() {
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

window.projectVariables = {};

export let sprites = [];
export let activeSprite = null;

const blockStyles = {
  logic_blocks: {
    colourPrimary: "#59BA57",
  },
  math_blocks: {
    colourPrimary: "#59BA57",
  },
  text_blocks: {
    colourPrimary: "#59BA57",
  },
  loop_blocks: {
    colourPrimary: "#FFAB19",
  },
  variable_blocks: {
    colourPrimary: "#FF8C1A",
  },
  list_blocks: {
    colourPrimary: "#E35340",
  },
  procedure_blocks: {
    colourPrimary: "#FF6680",
  },
  motion_blocks: {
    colourPrimary: "#4C97FF",
  },
  looks_blocks: {
    colourPrimary: "#9966FF",
  },
  events_blocks: {
    colourPrimary: "#FFC400",
  },
  control_blocks: {
    colourPrimary: "#FFAB19",
  },
  json_category: {
    colourPrimary: "#FF8349",
  },
};

const lightTheme = Blockly.Theme.defineTheme("customLightTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
});

const darkTheme = Blockly.Theme.defineTheme("customDarkTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
  componentStyles: {
    workspaceBackgroundColour: "#1a1e25",
    toolboxBackgroundColour: "#303236",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#212327",
    flyoutForegroundColour: "#ccc",
    flyoutOpacity: 1,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#fff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
  },
});

Blockly.blockRendering.register("custom_zelos", CustomRenderer);

const toolbox = document.getElementById("toolbox");
export const workspace = Blockly.inject("blocklyDiv", {
  toolbox: toolbox,
  scrollbars: true,
  trashcan: true,
  renderer: "custom_zelos",
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.9,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2,
  },
});
window.toolbox = toolbox;
window.workspace = workspace;

function toggleTheme(dark = false) {
  if (dark) root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  workspace.setTheme(dark ? darkTheme : lightTheme, workspace);
}

function toggleIcons(removeIcons = false) {
  if (removeIcons) root.classList.add("removeIcons");
  else root.classList.remove("removeIcons");
  localStorage.setItem("removeIcons", String(removeIcons));
}

toggleTheme(localStorage.getItem("theme") === "dark");
toggleIcons(localStorage.getItem("removeIcons") === "true");

workspace.registerToolboxCategoryCallback("GLOBAL_VARIABLES", function (ws) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement("button");
  button.setAttribute("text", "Create variable");
  button.setAttribute("callbackKey", "ADD_GLOBAL_VARIABLE");
  xmlList.push(button);

  if (Object.keys(window.projectVariables).length === 0) return xmlList;

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

  for (const name in window.projectVariables) {
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

workspace.registerButtonCallback("ADD_GLOBAL_VARIABLE", (button) => {
  const name = prompt("New variable name:");
  if (name) {
    let newName = name,
      count = 0;
    while (newName in window.projectVariables) {
      count++;
      newName = name + count;
    }

    window.projectVariables[newName] = 0;
  }
});

export function addSprite() {
  const texture = PIXI.Texture.from("./icons/ddededodediamante.png", {
    crossorigin: true,
  });
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = 0;
  sprite.y = 0;
  sprite.scale._parentScaleEvent = sprite;
  app.stage.addChild(sprite);

  const spriteData = {
    id: "sprite-" + Date.now(),
    pixiSprite: sprite,
    code: "",
    costumes: [{ name: "default", texture: texture }],
    sounds: [],
  };
  sprites.push(spriteData);
  setActiveSprite(spriteData);
}

export function setActiveSprite(spriteData) {
  activeSprite = spriteData;
  renderSpritesList(true);
  workspace.clear();

  if (spriteData == null) {
    deleteSpriteButton.disabled = true;
    return;
  } else deleteSpriteButton.disabled = false;

  const xmlText =
    activeSprite.code ||
    '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
  const xmlDom = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.domToWorkspace(xmlDom, workspace);
}

export function deleteActiveSprite() {
  if (!activeSprite) return;

  if (activeSprite.currentBubble) {
    app.stage.removeChild(activeSprite.currentBubble);
    activeSprite.currentBubble = null;
  }

  app.stage.removeChild(activeSprite.pixiSprite);

  const index = sprites.indexOf(activeSprite);

  sprites = sprites.filter((s) => s.id !== activeSprite.id);

  workspace.clear();

  if (sprites.length > 0) {
    setActiveSprite(sprites[Math.min(index, sprites.length - 1)]);
  } else {
    setActiveSprite(null);
  }
}

export function renderSpritesList(renderOthers = false) {
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

export function renderSpriteInfo() {
  const infoEl = document.getElementById("sprite-info");

  if (!activeSprite) {
    infoEl.innerHTML = "<p>Select a sprite to see its info.</p>";
  } else {
    const sprite = activeSprite.pixiSprite;

    infoEl.innerHTML = `
    <p>x: ${Math.round(sprite.x)}</p>
    <p>y: ${Math.round(-sprite.y)}</p>
    <p>angle: ${Math.round(sprite.angle)}</p>
    <p>size: ${Math.round(((sprite.scale.x + sprite.scale.y) / 2) * 100)}</p>
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

  const renameBtn = document.createElement("button");
  renameBtn.textContent = "Rename";

  renameBtn.onclick = () => {
    let willRename = true;

    renameBtn.style.display = "none";

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
      renameBtn.style.display = "";
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      else if (e.key === "Escape") {
        willRename = false;
      }
    });
  };

  container.appendChild(nameLabel);
  container.appendChild(renameBtn);

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

export function renderCostumesList() {
  costumesList.innerHTML = "";

  if (!activeSprite || !activeSprite.costumes) return;

  activeSprite.costumes.forEach((costume, index) => {
    const costumeContainer = document.createElement("div");
    costumeContainer.className = "costume-container";

    const img = new Image(60, 60);
    img.style.objectFit = "contain";
    img.src = costume.texture.baseTexture.resource.url;

    const renameableLabel = createRenameableLabel(costume.name, (newName) => {
      costume.name = newName;
    });

    const deleteBtn = createDeleteButton(() => {
      activeSprite.costumes.splice(index, 1);
      if (activeSprite.costumes.length > 0) {
        activeSprite.pixiSprite.texture = activeSprite.costumes[0].texture;
      } else {
        activeSprite.pixiSprite.texture = PIXI.Texture.EMPTY;
      }
      renderCostumesList();
    });

    costumeContainer.appendChild(img);
    costumeContainer.appendChild(renameableLabel);
    costumeContainer.appendChild(deleteBtn);

    costumesList.appendChild(costumeContainer);
  });
}

export function renderSoundsList() {
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
      sound.name = newName;
    });

    let sizeLabel;
    if (typeof sizeBytes === "number" && sizeBytes > 0) {
      sizeLabel = document.createElement("span");
      sizeLabel.style.marginLeft = "auto";
      sizeLabel.style.fontSize = "0.8em";
      sizeLabel.style.color = "#666";

      const sizeKB = sizeBytes / 1024;
      if (sizeKB < 1024) {
        sizeLabel.textContent = `${sizeKB.toFixed(2)} KB`;
      } else {
        sizeLabel.textContent = `${(sizeKB / 1024).toFixed(2)} MB`;
      }
    }

    const playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.className = "primary";
    playButton.onclick = () => {
      if (playButton.audio) {
        playButton.audio.pause();
        playButton.audio.currentTime = 0;
        playButton.textContent = "Play";
        playButton.audio = null;
      } else {
        const audio = new Audio(sound.dataURL);
        playButton.audio = audio;
        playButton.textContent = "Stop";

        audio.addEventListener("ended", () => {
          if (playButton.audio === audio) {
            playButton.textContent = "Play";
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

let currentRunId = 0;
let currentRunController = null;
const flagEvents = [];
const runningScripts = [];
window.shouldStop = false;

function promiseWithAbort(promiseOrFn, signal) {
  try {
    const p = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
    if (!(p instanceof Promise)) return Promise.resolve(p);

    if (signal.aborted) return Promise.reject(new Error("shouldStop"));

    return Promise.race([
      p,
      new Promise((_, rej) => {
        signal.addEventListener("abort", () => rej(new Error("shouldStop")), {
          once: true,
        });
      }),
    ]);
  } catch (err) {
    return Promise.reject(err);
  }
}

function stopAllScripts() {
  window.shouldStop = true;

  if (currentRunController) {
    try {
      currentRunController.abort();
    } catch (e) {}
    currentRunController = null;
  }
  currentRunId++;

  runningScripts.forEach((i) => {
    if (i.type === "timeout") clearTimeout(i.id);
    else if (i.type === "interval") clearInterval(i.id);
    else if (i.type === "raf") cancelAnimationFrame(i.id);
  });
  runningScripts.length = 0;

  flagEvents.length = 0;

  Object.keys(keysPressed).forEach((k) => delete keysPressed[k]);
  Object.keys(mouseButtonsPressed).forEach(
    (k) => delete mouseButtonsPressed[k]
  );

  sprites.forEach((spriteData) => {
    if (spriteData.currentBubble) {
      try {
        app.stage.removeChild(spriteData.currentBubble);
      } catch (e) {}
      spriteData.currentBubble = null;
    }
    if (spriteData.sayTimeout != null) {
      clearTimeout(spriteData.sayTimeout);
      spriteData.sayTimeout = null;
    }
  });

  for (const spriteSounds of playingSounds.values()) {
    for (const audio of spriteSounds.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
  playingSounds.clear();
}

async function runCode() {
  stopAllScripts();

  await new Promise((resolve) => requestAnimationFrame(resolve));

  const controller = new AbortController();
  const signal = controller.signal;
  currentRunController = controller;

  let projectStartedTime = Date.now();
  let thisRun = Number(currentRunId);

  sprites.forEach((spriteData) => {
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
      window.shouldStop = false;
      runCodeWithFunctions({
        code,
        thisRun,
        currentRunId,
        projectStartedTime,
        spriteData,
        app,
        flagEvents,
        mouseButtonsPressed,
        keysPressed,
        playingSounds,
        runningScripts,
        signal,
        promiseWithAbort,
        PIXI,
        runningScripts,
        penGraphics,
      });
    } catch (e) {
      console.error(`Error processing code for sprite ${spriteData.id}:`, e);
    }
  });

  const eventsForThisRun = flagEvents.filter((e) => e.runId === thisRun);

  for (const e of eventsForThisRun) {
    const idx = flagEvents.indexOf(e);
    if (idx !== -1) flagEvents.splice(idx, 1);
  }

  Promise.allSettled(
    eventsForThisRun.map((entry) => promiseWithAbort(entry.cb, signal))
  ).then((results) => {
    results.forEach((res) => {
      if (res.status === "rejected") {
        const e = res.reason;
        if (e?.message === "shouldStop") return;
        console.error(`Error running flag event:`, e);
      }
    });
  });
}

document
  .getElementById("add-sprite-button")
  .addEventListener("click", addSprite);
deleteSpriteButton.addEventListener("click", deleteActiveSprite);
document.getElementById("run-button").addEventListener("click", runCode);
document
  .getElementById("stop-button")
  .addEventListener("click", stopAllScripts);

workspace.addChangeListener((event) => {
  if (activeSprite && event.type !== Blockly.Events.UI) {
    const xmlDom = Blockly.Xml.workspaceToDom(workspace);
    activeSprite.code = Blockly.Xml.domToText(xmlDom);
  }
});

workspace.addChangeListener(Blockly.Events.disableOrphans);

addSprite();

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    if (tab !== "sounds") {
      document.querySelectorAll("#sounds-list button").forEach((i) => {
        if (i.audio) {
          i.audio.pause();
          i.audio.currentTime = 0;
          i.audio = null;
          i.textContent = "Play";
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

function saveProject() {
  const project = {
    sprites: sprites.map((sprite) => ({
      id: sprite.id,
      code: sprite.code,
      costumes: sprite.costumes.map((c) => {
        let dataURL;

        const url = c?.texture?.baseTexture?.resource?.url;
        if (typeof url === "string" && url.startsWith("data:")) {
          dataURL = url;
        } else {
          dataURL = app.renderer.extract.base64(new PIXI.Sprite(c.texture));
        }

        return {
          name: c.name,
          data: dataURL,
        };
      }),
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
    })),
    extensions: activeExtensions,
    variables: window.projectVariables ?? {},
  };

  const json = JSON.stringify(project);
  const utf8 = new TextEncoder().encode(json);
  const deflated = pako.deflate(utf8, { level: 9 });

  const blob = new Blob([deflated], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project.rarry";
  a.click();
  URL.revokeObjectURL(url);
}

async function loadProject(e) {
  const file = e.target.files[0];
  if (!file) return;

  stopAllScripts();

  const reader = new FileReader();
  reader.onload = async () => {
    const buffer = reader.result;

    let data;

    try {
      const text =
        typeof buffer === "string" ? buffer : new TextDecoder().decode(buffer);
      data = JSON.parse(text);
    } catch (e1) {
      try {
        const compressed = new Uint8Array(buffer);
        const inflated = pako.inflate(compressed);
        const json = new TextDecoder().decode(inflated);
        data = JSON.parse(json);
      } catch (e2) {
        console.error("Failed to parse file", e2);
        return window.alert("Invalid or corrupted project file.");
      }
    }

    if (!data || typeof data !== "object") {
      window.alert("Invalid file structure.");
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
          if (typeof ext === "string") {
            addExtension(ext);
          } else if (ext?.id) {
            const ExtensionClass = await eval("(" + ext.code + ")");
            await registerExtension(ExtensionClass);
          }
        }
      }

      app.stage.removeChildren().forEach((child) => {
        if (child.destroy) child.destroy();
      });
      sprites = [];

      if (!Array.isArray(data.sprites)) {
        window.alert("No valid sprites found in file.");
        return;
      }

      if (data.variables) window.projectVariables = data.variables;

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
            }
          });
        }

        if (Array.isArray(entry.sounds)) {
          entry.sounds.forEach((s) => {
            if (!s?.name || !s?.data) return;
            spriteData.sounds.push({ name: s.name, dataURL: s.data });
          });
        }

        let sprite;
        if (spriteData.costumes.length > 0) {
          sprite = new PIXI.Sprite(spriteData.costumes[0].texture);
        } else {
          sprite = new PIXI.Sprite();
        }

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
  };
  reader.readAsArrayBuffer(file);
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

    if (document.getElementById("costumes-tab").classList.contains("active")) {
      tabButtons.forEach((button) => {
        if (button.dataset.tab === "costumes") button.click();
      });
    }
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});

document.getElementById("sound-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !activeSprite) return;

  const reader = new FileReader();
  reader.onload = () => {
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
      dataURL: reader.result,
    });

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

window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});

const allowedKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "Enter",
  "Escape",
  ..."abcdefghijklmnopqrstuvwxyz0123456789",
  ..."abcdefghijklmnopqrstuvwxyz".toUpperCase(),
]);
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (allowedKeys.has(key)) {
    keysPressed[key] = true;
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
  if (activeSprite.pixiSprite === sprite) renderSpriteInfo();
});

SpriteChangeEvents.on("positionChanged", (sprite) => {
  if (activeSprite.pixiSprite === sprite) renderSpriteInfo();

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

function addExtension(id) {
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
}

addExtensionButton();

extensions.forEach((e) => {
  if (!e || !e.id) return;

  const extension = document.createElement("div");
  const addButton = document.createElement("button");
  addButton.onclick = () => addExtension(e.id);
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

async function minifyScript(code) {
  const RESERVED_GLOBALS = [
    "PIXI",
    "PIXIJS",
    "Blockly",
    "BlocklyJS",
    "PROJECT",
    "window",
    "document",
    "fetch",
    "btoa",
    "atob",
    "JSON",
    "Promise",
    "Array",
    "Map",
    "Set",
    "Audio",
    "Image",
    "console",
    "XMLHttpRequest",
  ];

  const result = await minify(code, {
    ecma: 2018,
    compress: {
      passes: 3,
      drop_console: true,
      drop_debugger: true,
      reduce_funcs: true,
      dead_code: true,
      unused: true,
      unsafe: false,
    },
    mangle: {
      toplevel: false,
      properties: false,
      reserved: RESERVED_GLOBALS,
    },
    format: {
      comments: false,
      beautify: false,
      inline_script: true,
    },
    keep_fnames: false,
    keep_classnames: false,
  });

  return result.code;
}

async function generateStandaloneHTML() {
  async function fetchSvgDataURL(path) {
    const svgText = await (await fetch(path)).text();
    const base64 = btoa(svgText);
    return `data:image/svg+xml;base64,${base64}`;
  }

  const project = {
    sprites: sprites.map((sprite) => {
      const tempWorkspace = new Blockly.Workspace();
      BlocklyJS.javascriptGenerator.init(tempWorkspace);

      const xmlText =
        sprite.code ||
        '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
      const xmlDom = Blockly.utils.xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(xmlDom, tempWorkspace);

      const code = BlocklyJS.javascriptGenerator.workspaceToCode(tempWorkspace);
      tempWorkspace.dispose();

      return {
        id: sprite.id,
        code,
        costumes: sprite.costumes.map((c) => {
          let dataURL;

          const url = c?.texture?.baseTexture?.resource?.url;
          if (typeof url === "string" && url.startsWith("data:")) {
            dataURL = url;
          } else {
            dataURL = app.renderer.extract.base64(new PIXI.Sprite(c.texture));
          }

          return {
            name: c.name,
            data: dataURL,
          };
        }),
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
    }),
    variables: window.projectVariables ?? {},
  };

  const pixiMinJs = await (
    await fetch("https://cdn.jsdelivr.net/npm/pixi.js@5.3.3/dist/pixi.min.js")
  ).text();

  const scriptContent = `
  const PROJECT = ${JSON.stringify(project)};
  (function(){
    const stageContainer = document.getElementById("stage");
    const wrapper = document.getElementById("stage-wrapper");
    const fullscreenButton = document.getElementById("fullscreen-button");
    const keysPressed = {};
    const mouseButtonsPressed = {};
    const playingSounds = new Map();
    const flagEvents = [];
    const runningScripts = [];
    let currentRunId = 0;
    let currentRunController = null;
    window.shouldStop = false;
    const BASE_WIDTH = ${BASE_WIDTH};const BASE_HEIGHT = ${BASE_HEIGHT};
    const app = new PIXI.Application({
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      backgroundColor: 0xffffff,
      powerPreference: "high-performance",
    });
    app.stageWidth = BASE_WIDTH;
    app.stageHeight = BASE_HEIGHT;
    ${resizeCanvas.toString()}
    resizeCanvas();
    window.addEventListener("resize", () => {resizeCanvas()});
    const allowedKeys = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "Enter",
      "Escape",
      ..."abcdefghijklmnopqrstuvwxyz0123456789",
      ..."abcdefghijklmnopqrstuvwxyz".toUpperCase(),
    ]);
    window.addEventListener("keydown", (e) => {
      const key = e.key;
      if (allowedKeys.has(key)) {
        keysPressed[key] = true;
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
    stageContainer.appendChild(app.view);
    const penGraphics = new PIXI.Graphics();
    penGraphics.clear();
    app.stage.addChildAt(penGraphics, 0);
    const sprites = [];
    if (PROJECT.variables) window.projectVariables = PROJECT.variables;
    PROJECT.sprites.forEach((entry, i) => {
      if (!entry || typeof entry !== "object") return;
      const spriteData = {
        id: entry.id || \`sprite-\${i}\`,
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
            console.warn(\`Failed to load costume: \${c.name}\`, err);
          }
        });
      }
      if (Array.isArray(entry.sounds)) {
        entry.sounds.forEach((s) => {
          if (!s?.name || !s?.data) return;
          spriteData.sounds.push({ name: s.name, dataURL: s.data });
        });
      }
      let sprite;
      if (spriteData.costumes.length > 0) {
        sprite = new PIXI.Sprite(spriteData.costumes[0].texture);
      } else {
        sprite = new PIXI.Sprite();
      }
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
    ${calculateBubblePosition.toString()}
    ${promiseWithAbort.toString()}
    function stopAllScripts() {
      window.shouldStop = true;
    
      if (currentRunController) {
        try {
          currentRunController.abort();
        } catch (e) {}
        currentRunController = null;
      }
      currentRunId++;
    
      runningScripts.forEach((i) => {
        if (i.type === "timeout") clearTimeout(i.id);
        else if (i.type === "interval") clearInterval(i.id);
        else if (i.type === "raf") cancelAnimationFrame(i.id);
      });
      runningScripts.length = 0;
    
      flagEvents.length = 0;
    
      Object.keys(keysPressed).forEach((k) => delete keysPressed[k]);
      Object.keys(mouseButtonsPressed).forEach(
        (k) => delete mouseButtonsPressed[k]
      );
    
      sprites.forEach((spriteData) => {
        if (spriteData.currentBubble) {
          try {
            app.stage.removeChild(spriteData.currentBubble);
          } catch (e) {}
          spriteData.currentBubble = null;
        }
        if (spriteData.sayTimeout != null) {
          clearTimeout(spriteData.sayTimeout);
          spriteData.sayTimeout = null;
        }
      });
    
      for (const spriteSounds of playingSounds.values()) {
        for (const audio of spriteSounds.values()) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
      playingSounds.clear();
    }
    ${runCodeWithFunctions.toString()}
    async function runCode() {
      stopAllScripts();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const controller = new AbortController();
      const signal = controller.signal;
      currentRunController = controller;
      let projectStartedTime = Date.now();
      let thisRun = Number(currentRunId);
      sprites.forEach((spriteData) => {
        window.shouldStop = false;
        const code = spriteData.code;
        try {
          runCodeWithFunctions({
            code,
            thisRun,
            currentRunId,
            projectStartedTime,
            spriteData,
            app,
            flagEvents,
            mouseButtonsPressed,
            keysPressed,
            playingSounds,
            runningScripts,
            promiseWithAbort,
            signal,
            PIXI,
            runningScripts,
            penGraphics
          });
        } catch (e) {
          console.error(\`Error processing code for sprite \${spriteData.id}:\`, e);
        }
      });
      const eventsForThisRun = flagEvents.filter((e) => e.runId === thisRun);
      for (const e of eventsForThisRun) {
        const idx = flagEvents.indexOf(e);
        if (idx !== -1) flagEvents.splice(idx, 1);
      }
      Promise.allSettled(
        eventsForThisRun.map((entry) => promiseWithAbort(entry.cb, signal))
      ).then((results) => {
        results.forEach((res) => {
          if (res.status === "rejected") {
            const e = res.reason;
            if (e?.message === "shouldStop") return;
            console.error(\`Error running flag event:\`, e);
          }
        });
      });
    }
    document.getElementById("run-button").addEventListener("click", runCode);
    document.getElementById("stop-button").addEventListener("click", stopAllScripts);
  })();`;
  const minifiedScript = await minifyScript(scriptContent);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Rarry Export</title>
  <style>
    :root {
      --dark: #e2e8f0;
      --dark-light: #c8cdd4;
      --primary: #3b82f6;
      --primary-dark: #336ce7;
      --danger: #f63b3b;
      --danger-dark: #dd3434;
      --color1: #262d36;
      --color2: #2f3741;
      --color3: #3d4552;
      --color4: #464f5e;
    }
    button {
      font-family: var(--font);
      font-size: medium;
      font-weight: 700;
      padding: 0.5rem 0.9rem;
      border-radius: 0.5rem;
      border: none;
      background-color: var(--dark);
      color: var(--color1);
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: var(--dark-light);
    }
    #stage-wrapper {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
    }
    #stage-div {
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      z-index: 9999;           
      background: var(--color1);
    }
    #stage canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    #stage-controls {
      background-color: var(--color1);
      padding: 0.5rem;
      border-bottom: 2px solid var(--color3);
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    #stage-controls button {
      padding: 0.5rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 25%;
      background-color: var(--color2);
      transition: background-color 0.2s;
    }
    #stage-controls button:hover {
      background-color: var(--color3);
    }
    #stage-controls button img {
      width: 100%;
      height: 100%;
    }
  </style>
  <script>
    ${pixiMinJs}
  </script>
</head>
<body>
  <div id="stage-div">
    <div id="stage-controls">
      <button id="run-button">
        <img src="${await fetchSvgDataURL("icons/flag.svg")}">
      </button>
      <button id="stop-button">
        <img src="${await fetchSvgDataURL("icons/stop.svg")}">
      </button>
    </div>
    <div id="stage-wrapper">
      <div id="stage"></div>
    </div>
  </div>

  <script>
    ${minifiedScript}
  </script>
</body>
</html>`;
  return html;
}

async function downloadStandaloneHTML(filename = "rarryProject") {
  try {
    const html = await generateStandaloneHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename + ".html";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Export failed (see console).");
  }
}

document
  .getElementById("export-button")
  .addEventListener("click", () => downloadStandaloneHTML());

document.getElementById("theme-button").addEventListener("click", () =>
  showPopup({
    title: "Appearance",
    rows: [
      [
        "Theme:",
        {
          type: "button",
          label: '<i class="fa-solid fa-sun"></i> Light',
          onClick: () => toggleTheme(false),
        },
        {
          type: "button",
          label: '<i class="fa-solid fa-moon"></i> Dark',
          onClick: () => toggleTheme(true),
        },
      ],
      [
        "Show icon on buttons:",
        {
          type: "checkbox",
          checked: !root.classList.contains("removeIcons"),
          onChange: (checked, _popup) => {
            toggleIcons(!checked);
          },
        },
      ],
    ],
  })
);

document
  .getElementById("extensions-custom-button")
  .addEventListener("click", () =>
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
                      const ExtensionClass = eval("(" + event.data.code + ")");
                      registerExtension(ExtensionClass);

                      console.log("Extension registered:", ExtensionClass);
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
        ],
      ],
    })
  );
