import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import * as PIXI from "pixi.js";

import CustomRenderer from "./render.js";
import { SpriteChangeEvents } from "./patches.js";
import.meta.glob("../blocks/**/*.js", { eager: true });

BlocklyJS.javascriptGenerator.addReservedWords(
  `whenFlagClicked,moveSteps,changePosition,setPosition,getPosition,getAngle,
  getMousePosition,sayMessage,waitOneFrame,wait,switchCostume,setSize,setAngle,
  projectTime,isKeyPressed,isMouseButtonPressed,getCostumeSize,getSpriteScale,
  _startTween,startTween,soundProperties,getSoundProperty,setSoundProperty,
  playSOund,stopSound,stopAllSounds,isMouseTouchingSprite,setPenStatus,
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
const themeToggle = document.getElementById("theme-toggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") root.classList.add("dark");

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

function resizeCanvas() {
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

const penGraphics = new PIXI.Graphics();
penGraphics.clear();
app.stage.addChildAt(penGraphics, 0);

let sprites = [];
let activeSprite = null;

app.ticker.add(() => {
  sprites.forEach((spriteData) => {
    if (!spriteData.lastPos) {
      spriteData.lastPos = {
        x: spriteData.pixiSprite.x,
        y: spriteData.pixiSprite.y,
      };
      if (spriteData.penDown) return;
    }
    const { x: x0, y: y0 } = spriteData.lastPos;
    const x1 = spriteData.pixiSprite.x;
    const y1 = spriteData.pixiSprite.y;
    if (spriteData.penDown) {
      penGraphics.lineStyle(
        spriteData.penSize || 1,
        PIXI.utils.rgb2hex([
          spriteData.penColor?.r / 255 || 0,
          spriteData.penColor?.g / 255 || 0,
          spriteData.penColor?.b / 255 || 0,
        ])
      );
      penGraphics.moveTo(x0, y0);
      penGraphics.lineTo(x1, y1);
    }
    spriteData.lastPos = { x: x1, y: y1 };
  });
});

const blockStyles = {
  logic_blocks: {
    colourPrimary: "#59ba57",
  },
  math_blocks: {
    colourPrimary: "#59ba57",
  },
  text_blocks: {
    colourPrimary: "#59ba57",
  },
  loop_blocks: {
    colourPrimary: "#FFAB19",
  },
  variable_blocks: {
    colourPrimary: "#FF8C1A",
  },
  list_blocks: {
    colourPrimary: "#e35340",
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
    colourPrimary: "#ff8349",
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
    workspaceBackgroundColour: "#1e1e1e",
    toolboxBackgroundColour: "#333",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#252526",
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
const workspace = Blockly.inject("blocklyDiv", {
  toolbox: toolbox,
  scrollbars: true,
  trashcan: true,
  renderer: "custom_zelos",
  theme: savedTheme === "dark" ? darkTheme : lightTheme,
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

themeToggle.innerText = savedTheme === "dark" ? "Light Theme" : "Dark Theme";
themeToggle.addEventListener("click", () => {
  root.classList.toggle("dark");
  const isDark = root.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  workspace.setTheme(isDark ? darkTheme : lightTheme, workspace);
  themeToggle.innerText = isDark ? "Light Theme" : "Dark Theme";
});

function addSprite() {
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

function setActiveSprite(spriteData) {
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

function deleteActiveSprite() {
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

function calculateBubblePosition(
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

const flagEvents = [];
const runningScripts = [];
let currentRunId = 0;
window.shouldStop = false;

function stopAllScripts() {
  window.shouldStop = true;
  currentRunId++;

  runningScripts.forEach((i) => {
    if (i.type === "timeout") clearTimeout(i.id);
    else if (i.type === "raf") cancelAnimationFrame(i.id);
  });
  runningScripts.length = 0;
  flagEvents.length = 0;
  Object.assign(keysPressed, {});
  Object.assign(mouseButtonsPressed, {});

  sprites.forEach((spriteData) => {
    if (spriteData.currentBubble) {
      app.stage.removeChild(spriteData.currentBubble);
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

function runCode() {
  stopAllScripts();
  window.shouldStop = false;
  let projectStartedTime = Date.now();
  let thisRun = currentRunId;

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
      function whenFlagClicked(callback) {
        if (thisRun !== currentRunId || window.shouldStop) return;
        flagEvents.push(async () => {
          if (thisRun !== currentRunId || window.shouldStop) return;
          try {
            await callback();
          } catch (e) {
            if (e?.message === "shouldStop") return;
            console.error(e);
          }
        });
      }

      function moveSteps(steps) {
        if (thisRun !== currentRunId || window.shouldStop) return;
        const sprite = spriteData.pixiSprite;
        const angle = sprite.rotation;
        sprite.x += Math.cos(angle) * Number(steps);
        sprite.y += Math.sin(angle) * Number(steps);
      }

      function changePosition(menu, amount) {
        if (thisRun !== currentRunId || window.shouldStop) return;
        const sprite = spriteData.pixiSprite;
        if (menu === "x") sprite.x += Number(amount);
        else if (menu === "y") sprite.y -= Number(amount);
      }

      function setPosition(menu, amount) {
        if (thisRun !== currentRunId || window.shouldStop) return;
        const sprite = spriteData.pixiSprite;
        if (menu === "x") sprite.x = Number(amount);
        else if (menu === "y") sprite.y = -Number(amount);
      }

      function getPosition(menu) {
        const sprite = spriteData.pixiSprite;
        if (menu === "x") return sprite.x;
        else if (menu === "y") return -sprite.y;
      }

      const getAngle = () => spriteData.pixiSprite.angle;

      function getMousePosition(menu) {
        const mouse = app.renderer.plugins.interaction.mouse.global;
        if (menu === "x")
          return Math.round(
            (mouse.x - app.renderer.width / 2) / app.stage.scale.x
          );
        else if (menu === "y")
          return -Math.round(
            (mouse.y - app.renderer.height / 2) / app.stage.scale.y
          );
      }

      function sayMessage(message, seconds) {
        if (thisRun !== currentRunId) return;

        if (spriteData.currentBubble) {
          app.stage.removeChild(spriteData.currentBubble);
          spriteData.currentBubble = null;
        }
        if (spriteData.sayTimeout != null) {
          clearTimeout(spriteData.sayTimeout);
          spriteData.sayTimeout = null;
        }

        if (window.shouldStop) return;

        message = String(message);
        if (!message || message === "") return;

        const padding = 10;
        const tailHeight = 15;
        const tailWidth = 15;
        const bubbleColor = 0xffffff;
        const lineColor = 0xbdc1c7;
        const textColor = 0x000000;

        const bubble = new PIXI.Graphics();

        const style = new PIXI.TextStyle({
          fill: textColor,
          fontSize: 24,
        });
        const text = new PIXI.Text(message, style);

        const bubbleWidth = text.width + padding * 2;
        const bubbleHeight = text.height + padding * 2;

        bubble.beginFill(bubbleColor);
        bubble.lineStyle(2, lineColor);
        bubble.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, 10);

        bubble.moveTo(bubbleWidth / 2 - tailWidth / 2, bubbleHeight);
        bubble.lineTo(bubbleWidth / 2, bubbleHeight + tailHeight);
        bubble.lineTo(bubbleWidth / 2 + tailWidth / 2, bubbleHeight);
        bubble.closePath();
        bubble.endFill();

        text.x = padding;
        text.y = padding;

        const container = new PIXI.Container();
        container.addChild(bubble);
        container.addChild(text);

        const pos = calculateBubblePosition(
          spriteData.pixiSprite,
          bubbleWidth,
          bubbleHeight,
          tailHeight
        );
        container.x = pos.x;
        container.y = pos.y;

        app.stage.addChild(container);
        spriteData.currentBubble = container;

        if (typeof seconds !== "number" || seconds <= 0 || seconds > 2147483647)
          return;

        spriteData.sayTimeout = setTimeout(() => {
          if (spriteData.currentBubble === container) {
            app.stage.removeChild(container);
            spriteData.currentBubble = null;
          }
          spriteData.sayTimeout = null;
        }, seconds * 1000);
      }

      function waitOneFrame() {
        return new Promise((res, rej) => {
          if (window.shouldStop || thisRun !== currentRunId)
            return rej("stopped");

          const id = requestAnimationFrame(() => {
            if (window.shouldStop || thisRun !== currentRunId)
              return rej("stopped");
            runningScripts.splice(
              runningScripts.findIndex((t) => t.id === id),
              1
            );
            res();
          });
          runningScripts.push({ type: "raf", id });
        });
      }

      function wait(ms) {
        return new Promise((res, rej) => {
          if (window.shouldStop || thisRun !== currentRunId)
            return rej("stopped");

          const id = setTimeout(() => {
            if (window.shouldStop || thisRun !== currentRunId)
              return rej("stopped");
            runningScripts.splice(
              runningScripts.findIndex((t) => t.id === id),
              1
            );
            res();
          }, ms);
          runningScripts.push({ type: "timeout", id });
        });
      }

      function switchCostume(name) {
        if (thisRun !== currentRunId || window.shouldStop) return;

        const found = spriteData.costumes.find((c) => c.name === name);
        if (found) {
          spriteData.pixiSprite.texture = found.texture;
        }
      }

      function setSize(amount, additive) {
        if (thisRun !== currentRunId || window.shouldStop) return;

        if (additive) {
          const scaleX = spriteData.pixiSprite.scale.x + amount / 100;
          const scaleY = spriteData.pixiSprite.scale.y + amount / 100;
          spriteData.pixiSprite.scale.set(scaleX, scaleY);
        } else {
          const scale = amount / 100;
          spriteData.pixiSprite.scale.set(scale, scale);
        }
      }

      function setAngle(amount, additive) {
        if (thisRun !== currentRunId || window.shouldStop) return;

        if (additive) {
          spriteData.pixiSprite.angle =
            (spriteData.pixiSprite.angle + amount) % 360;
        } else {
          spriteData.pixiSprite.angle = amount % 360;
        }

        if (spriteData.pixiSprite.angle < 0) {
          spriteData.pixiSprite.angle += 360;
        }
      }

      function projectTime() {
        return (Date.now() - projectStartedTime) / 1000;
      }

      function isKeyPressed(key) {
        if (key === "any") {
          return Object.values(keysPressed).some((pressed) => pressed);
        }

        return !!keysPressed[key];
      }

      function isMouseButtonPressed(button) {
        if (button === "any") {
          return Object.values(mouseButtonsPressed).some((pressed) => pressed);
        }

        return !!mouseButtonsPressed[Number(button)];
      }

      function getCostumeSize(type) {
        const frame = spriteData?.pixiSprite?.texture?.frame;
        if (!frame) return 0;

        if (type === "width") {
          return frame.width;
        } else if (type === "height") {
          return frame.height;
        } else {
          return 0;
        }
      }

      function getSpriteScale() {
        const scaleX = spriteData.pixiSprite.scale.x;
        const scaleY = spriteData.pixiSprite.scale.y;
        return ((scaleX + scaleY) / 2) * 100;
      }

      function _startTween({
        from,
        to,
        duration,
        easing,
        onUpdate,
        wait = true,
      }) {
        if (thisRun !== currentRunId) return;
        const tweenPromise = new Promise((resolve, reject) => {
          const start = performance.now();
          const change = to - from;
          const easeFn = TweenEasing[easing] || TweenEasing.linear;

          function tick(now) {
            if (window.shouldStop || thisRun !== currentRunId) return resolve();

            const t = Math.min((now - start) / (duration * 1000), 1);
            const value = from + change * easeFn(t);

            try {
              onUpdate && onUpdate(value);
            } catch (err) {
              if (err.message === "shouldStop") return resolve();
              return reject(err);
            }

            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              resolve();
            }
          }

          const id = requestAnimationFrame(tick);
          runningScripts.push({ type: "raf", id });
        });

        return wait ? tweenPromise : undefined;
      }

      async function startTween(options) {
        try {
          if (thisRun !== currentRunId) return;
          await _startTween(options);
        } catch (err) {
          if (err.message === "shouldStop") {
            return;
          } else {
            console.error(err);
          }
        }
      }

      let soundProperties = {
        volume: 100,
        speed: 100,
      };

      const getSoundProperty = (property) => soundProperties[property];
      function setSoundProperty(property, value) {
        if (!soundProperties[property]) return;
        if (property === "speed") value = Math.min(1600, Math.max(7, value));
        if (property === "volume") value = Math.min(100, Math.max(0, value));
        soundProperties[property] = value;
      }

      async function playSound(name, wait = false) {
        const sound = spriteData.sounds.find((s) => s.name === name);
        if (!sound) return;

        if (!playingSounds.has(spriteData.id))
          playingSounds.set(spriteData.id, new Map());

        const spriteSounds = playingSounds.get(spriteData.id);

        const oldAudio = spriteSounds.get(name);
        if (oldAudio) {
          oldAudio.pause();
          oldAudio.currentTime = 0;
        }

        const audio = new Audio(sound.dataURL);
        spriteSounds.set(name, audio);

        audio.volume = soundProperties.volume / 100;
        audio.playbackRate = soundProperties.speed / 100;
        audio.play();

        const cleanup = () => {
          if (spriteSounds.get(name) === audio) {
            spriteSounds.delete(name);
          }
        };

        audio.addEventListener("ended", cleanup);
        audio.addEventListener("pause", cleanup);

        if (wait) {
          return new Promise((res) => {
            audio.addEventListener("ended", () => res());
          });
        }
      }

      function stopSound(name) {
        const spriteSounds = playingSounds.get(spriteData.id);
        if (!spriteSounds || !spriteSounds.has(name)) return;

        const audio = spriteSounds.get(name);
        audio.pause();
        audio.currentTime = 0;
        spriteSounds.delete(name);
      }

      function stopAllSounds(thisSprite = false) {
        if (thisSprite) {
          const spriteSounds = playingSounds.get(spriteData.id);
          if (!spriteSounds) return;

          for (const audio of spriteSounds.values()) {
            audio.pause();
            audio.currentTime = 0;
          }

          playingSounds.delete(spriteData.id);
        } else {
          for (const spriteSounds of playingSounds.values()) {
            for (const audio of spriteSounds.values()) {
              audio.pause();
              audio.currentTime = 0;
            }
          }
          playingSounds.clear();
        }
      }

      function isMouseTouchingSprite() {
        const mouse = app.renderer.plugins.interaction.mouse.global;
        const bounds = spriteData.pixiSprite.getBounds();
        return bounds.contains(mouse.x, mouse.y);
      }

      function setPenStatus(active) {
        spriteData.penDown = !!active;
      }

      const setPenColor = (r = 0, g = 0, b = 0) => {
        if (typeof r === "string") {
          const [r_, g_, b_] = r.split(",").map((s) => parseInt(s.trim()));
          spriteData.penColor = { r: r_, g: g_, b: b_ };
        } else {
          spriteData.penColor = { r, g, b };
        }
      };
      const setPenColorHex = (value) => {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
        spriteData.penColor = result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 };
      };

      function setPenSize(size) {
        spriteData.penSize = size;
      }

      function clearPen() {
        penGraphics.clear();
      }

      eval(code);
    } catch (e) {
      console.error(`Error processing code for sprite ${spriteData.id}:`, e);
    }
  });

  Promise.allSettled(
    flagEvents.map((callback) => {
      try {
        const result = callback();
        if (result instanceof Promise) return result;
        return Promise.resolve(result);
      } catch (e) {
        return Promise.reject(e);
      }
    })
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
  };

  const blob = new Blob([JSON.stringify(project)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project.rarry";
  a.click();
  URL.revokeObjectURL(url);
}

function loadProject(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let data;

    try {
      data = JSON.parse(reader.result);
    } catch (error) {
      window.alert("Invalid file: not valid JSON.");
      return;
    }

    if (!data || typeof data !== "object") {
      window.alert("Invalid file structure.");
      return;
    }

    if (!data.sprites && !data.extensions) {
      data = { sprites: data, extensions: [] };
    }

    try {
      data?.extensions?.forEach((extId) => {
        if (typeof extId === "string") addExtension(extId);
      });

      sprites.forEach((s) => app.stage.removeChild(s.pixiSprite));
      sprites = [];

      if (!Array.isArray(data.sprites)) {
        window.alert("No valid sprites found in file.");
        return;
      }

      data.sprites.forEach((entry, i) => {
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
  reader.readAsText(file);
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
    const pos = calculateBubblePosition(
      spriteData.pixiSprite,
      spriteData.currentBubble.width,
      spriteData.currentBubble.height
    );
    spriteData.currentBubble.x = pos.x;
    spriteData.currentBubble.y = pos.y;
  }
});

SpriteChangeEvents.on("textureChanged", () => {
  renderSpritesList(false);
});

/* setup extensions stuff */

const activeExtensions = [];

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
