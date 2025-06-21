const wrapper = document.getElementById("stage-wrapper");
const stageContainer = document.getElementById("stage");
const costumesList = document.getElementById("costumes-list");
const loadInput = document.getElementById("load-input");
const loadButton = document.getElementById("load-button");
const deleteSpriteButton = document.getElementById("delete-sprite-button");
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const toggleBtn = document.getElementById("theme-toggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") root.classList.add("dark");

const BASE_WIDTH = 480;
const BASE_HEIGHT = 360;

const app = new PIXI.Application({
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  backgroundColor: 0xffffff,
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
};

const lightTheme = Blockly.Theme.defineTheme("customLightTheme", {
  base: Blockly.Themes.Classic,
  blockStyles: blockStyles,
});

const darkTheme = Blockly.Theme.defineTheme("customLightTheme", {
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

Blockly.VerticalFlyout.prototype.getFlyoutScale = () => 0.9;

const toolbox = document.getElementById("toolbox");
const workspace = Blockly.inject("blocklyDiv", {
  toolbox: toolbox,
  scrollbars: true,
  trashcan: true,
  renderer: "zelos",
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

toggleBtn.addEventListener("click", () => {
  root.classList.toggle("dark");
  const isDark = root.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  workspace.setTheme(isDark ? darkTheme : lightTheme, workspace);
});

let sprites = [];
let activeSprite = null,
  lastSpriteX = null,
  lastSpriteY = null,
  lastSpriteAngle = null;

function addSprite() {
  const texture = PIXI.Texture.from(
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/106114/cat.png",
    {
      crossorigin: true,
    }
  );
  const sprite = new PIXI.Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.x = 0;
  sprite.y = 0;
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
  renderSpritesList();
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

  lastSpriteX = spriteData.pixiSprite.x;
  lastSpriteY = spriteData.pixiSprite.y;
  lastSpriteAngle = spriteData.pixiSprite.rotation;
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

function renderSpritesList() {
  const listEl = document.getElementById("sprites-list");
  listEl.innerHTML = "";
  sprites.forEach((spriteData) => {
    const spriteIconContainer = document.createElement("div");
    if (activeSprite && activeSprite.id === spriteData.id)
      spriteIconContainer.className = "active";

    const img = new Image(60, 60);
    img.style.objectFit = "contain";

    const costumeTexture = spriteData.costumes[0].texture;
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

  renderSpriteInfo();
  renderCostumesList();
}

function renderSpriteInfo() {
  const infoEl = document.getElementById("sprite-info");

  if (!activeSprite) {
    infoEl.innerHTML = "<p>Select a sprite to see its info.</p>";
  } else {
    infoEl.innerHTML = `
    <p>x: ${Math.round(activeSprite.pixiSprite.x)}</p>
    <p>y: ${Math.round(-activeSprite.pixiSprite.y)}</p>
    <p>angle: ${activeSprite.pixiSprite.rotation}</p>`;
  }
}

function renderCostumesList() {
  costumesList.innerHTML = "";

  activeSprite.costumes.forEach((costume) => {
    const costumeContainer = document.createElement("div");
    costumeContainer.className = "costume-container";

    const img = new Image(60, 60);
    img.style.objectFit = "contain";
    img.src = costume.texture.baseTexture.resource.url;

    const nameLabel = document.createElement("p");
    nameLabel.textContent = costume.name;

    costumeContainer.appendChild(img);
    costumeContainer.appendChild(nameLabel);
    costumesList.appendChild(costumeContainer);
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

let runningScripts = [],
  shouldStop = false,
  projectStartedTime = Date.now();

function stopAllScripts() {
  shouldStop = true;

  runningScripts.forEach(clearTimeout);
  runningScripts = [];

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
}

function runCode() {
  stopAllScripts();
  shouldStop = false;
  projectStartedTime = Date.now();

  const flagEvents = [];

  sprites.forEach((spriteData) => {
    const tempWorkspace = new Blockly.Workspace();
    Blockly.JavaScript.init(tempWorkspace);

    const xmlText =
      spriteData.code ||
      '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
    const xmlDom = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.domToWorkspace(xmlDom, tempWorkspace);

    const code = Blockly.JavaScript.workspaceToCode(tempWorkspace);
    tempWorkspace.dispose();

    try {
      const whenFlagClicked = (callback) => {
        flagEvents.push(callback);
      };

      const moveSteps = (steps) => {
        const sprite = spriteData.pixiSprite;
        const angle = sprite.rotation;
        sprite.x += Math.cos(angle) * Number(steps);
        sprite.y -= Math.sin(angle) * Number(steps);
      };

      const changePosition = (menu, amount) => {
        const sprite = spriteData.pixiSprite;
        if (menu === "x") sprite.x += Number(amount);
        else if (menu === "y") sprite.y -= Number(amount);
      };

      const setPosition = (menu, amount) => {
        const sprite = spriteData.pixiSprite;
        if (menu === "x") sprite.x = Number(amount);
        else if (menu === "y") sprite.y = -Number(amount);
      };

      const getPosition = (menu) => {
        const sprite = spriteData.pixiSprite;
        if (menu === "x") return sprite.x;
        else if (menu === "y") return -sprite.y;
        else if (menu === "angle") return sprite.rotation;
      };

      const getMousePosition = (menu) => {
        const mouse = app.renderer.plugins.interaction.mouse.global;
        if (menu === "x")
          return Math.round(
            (mouse.x - app.renderer.width / 2) / app.stage.scale.x
          );
        else if (menu === "y")
          return -Math.round(
            (mouse.y - app.renderer.height / 2) / app.stage.scale.y
          );
      };

      const sayMessage = (message, seconds) => {
        if (shouldStop) return;
        if (spriteData.currentBubble) {
          app.stage.removeChild(spriteData.currentBubble);
          spriteData.currentBubble = null;
        }
        if (spriteData.sayTimeout != null) {
          clearTimeout(spriteData.sayTimeout);
          spriteData.sayTimeout = null;
        }

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
      };

      const waitOneFrame = () => {
        return new Promise((r) => setTimeout(r, 0));
      };

      const wait = (amount) => {
        return new Promise((resolve, reject) => {
          if (shouldStop) return reject(new Error("shouldStop"));

          const timeout = setTimeout(() => {
            runningScripts = runningScripts.filter((id) => id !== timeout);
            resolve();
          }, amount);

          runningScripts.push(timeout);
        });
      };

      const switchCostume = (name) => {
        const found = spriteData.costumes.find((c) => c.name === name);
        if (found) {
          spriteData.pixiSprite.texture = found.texture;
        }
      };

      const projectTime = () => {
        return (Date.now() - projectStartedTime) / 1000;
      };

      const isKeyPressed = (key) => !!keysPressed[key];

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
        if (e.message === "shouldStop") return;
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

const dragInfo = {};

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

    tabButtons.forEach((btn) => {
      btn.classList.add("inactive");
    });

    button.classList.remove("inactive");

    tabContents.forEach((content) => {
      content.classList.toggle("active", content.id === `${tab}-tab`);
    });

    if (tab === "code") {
      setTimeout(() => Blockly.svgResize(workspace), 0);
    } else if (tab === "costumes") {
      renderCostumesList();
    }
  });
});

function saveProject() {
  const project = sprites.map((sprite) => ({
    id: sprite.id,
    code: sprite.code,
    costumes: sprite.costumes.map((c) => {
      let dataURL;
      if (c.texture.baseTexture.resource.url.startsWith("data:")) {
        dataURL = c.texture.baseTexture.resource.url;
      } else {
        dataURL = app.renderer.extract.base64(new PIXI.Sprite(c.texture));
      }

      return {
        name: c.name,
        data: dataURL,
      };
    }),
    sounds: sprite.sounds.map((s) => ({ name: s.name, data: s.dataURL })),
  }));

  const blob = new Blob([JSON.stringify(project)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "project.json";
  a.click();
  URL.revokeObjectURL(url);
}

function loadProject(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    sprites.forEach((s) => app.stage.removeChild(s.pixiSprite));
    sprites = [];
    data.forEach((entry) => {
      const spriteData = {
        id: entry.id,
        code: entry.code,
        costumes: [],
        sounds: [],
      };

      entry.costumes.forEach((c) => {
        const texture = PIXI.Texture.from(c.data);
        spriteData.costumes.push({ name: c.name, texture });
      });

      entry.sounds.forEach((s) =>
        spriteData.sounds.push({ name: s.name, dataURL: s.data })
      );

      const sprite = new PIXI.Sprite(spriteData.costumes[0].texture);
      sprite.anchor.set(0.5);
      sprite.x = 0;
      sprite.y = 0;
      app.stage.addChild(sprite);
      spriteData.pixiSprite = sprite;
      sprites.push(spriteData);
    });
    setActiveSprite(sprites[0] || null);
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
    const costumeName = file.name.split(".")[0];
    activeSprite.costumes.push({ name: costumeName, texture });

    activeSprite.pixiSprite.texture = texture;

    if (document.getElementById("costumes-tab").classList.contains("active")) {
      tabButtons.forEach((button) => {
        if (button.dataset.tab === "costumes") button.click();
      });
    }
  };
  reader.readAsDataURL(file);
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

window.addEventListener("keydown", (e) => {
  keysPressed[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keysPressed[e.key] = false;
});

app.ticker.add(() => {
  if (!activeSprite) return;

  const sprite = activeSprite.pixiSprite;
  const x = sprite.x;
  const y = sprite.y;
  const angle = sprite.rotation;

  if (x !== lastSpriteX || y !== lastSpriteY || angle !== lastSpriteAngle) {
    lastSpriteX = x;
    lastSpriteY = y;
    lastSpriteAngle = angle;
    renderSpriteInfo();
  }

  sprites.forEach((spriteData) => {
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
});
