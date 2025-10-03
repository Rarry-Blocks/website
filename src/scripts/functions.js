import { calculateBubblePosition } from "./editor";
import { Thread } from "./threads";

const BUBBLE_PADDING = 10;
const BUBBLE_TAIL_HEIGHT = 15;
const BUBBLE_TAIL_WIDTH = 15;
const BUBBLE_COLOR = 0xffffff;
const LINE_COLOR = 0xbdc1c7;

export function runCodeWithFunctions({
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
  promiseWithAbort,
  signal,
  PIXI,
  runningScripts,
  penGraphics,
}) {
  Thread.resetAll();
  var fastExecution = false;

  const BUBBLE_TEXTSTYLE = new PIXI.TextStyle({ fill: 0x000000, fontSize: 24 });
  const sprite = spriteData.pixiSprite;
  const renderer = app.renderer;
  const stage = app.stage;
  const costumeMap = new Map(
    (spriteData.costumes || []).map((c) => [c.name, c])
  );
  const soundMap = new Map((spriteData.sounds || []).map((s) => [s.name, s]));

  function stopped() {
    return (
      thisRun !== currentRunId ||
      window.shouldStop ||
      (signal && signal.aborted)
    );
  }

  code = '"use strict";\n' + code;

  function whenFlagClicked(callback) {
    if (stopped()) return;

    const runId = thisRun;

    flagEvents.push({
      runId,
      cb: async () => {
        if (stopped()) return;

        const threadId = Thread.create();
        Thread.enter(threadId);

        try {
          const result = await promiseWithAbort(
            () => callback(Thread.getCurrentContext()),
            signal
          );

          if (result === "shouldStop" || stopped()) return;
        } catch (err) {
          if (err.message !== "shouldStop") console.error(err);
        } finally {
          Thread.exit();
        }
      },
    });
  }

  function moveSteps(steps) {
    if (stopped()) return;
    const angle = sprite.rotation;
    sprite.x += Math.cos(angle) * +steps;
    sprite.y += Math.sin(angle) * +steps;
  }

  function changePosition(menu, amount) {
    if (stopped()) return;
    if (menu === "x") sprite.x += +amount;
    else if (menu === "y") sprite.y -= +amount;
  }

  function setPosition(menu, x, y) {
    if (stopped()) return;

    if (menu === "x") {
      sprite.x = +x;
    } else if (menu === "y") {
      sprite.y = -+y;
    } else if (menu === "xy") {
      sprite.setPosition({ x: +x, y: -+y });
    }
  }

  function getPosition(menu) {
    if (menu === "x") return sprite.x;
    else if (menu === "y") return -sprite.y;
  }

  const getAngle = () => sprite.angle;

  function getMousePosition(menu) {
    const mouse = renderer.plugins.interaction.mouse.global;
    if (menu === "x")
      return Math.round((mouse.x - renderer.width / 2) / stage.scale.x);
    else if (menu === "y")
      return -Math.round((mouse.y - renderer.height / 2) / stage.scale.y);
  }

  function sayMessage(message, seconds) {
    if (stopped()) return;

    message = String(message || "");
    if (!message) return;

    if (!spriteData.currentBubble) {
      const bubble = new PIXI.Graphics();
      const text = new PIXI.Text("", BUBBLE_TEXTSTYLE);
      text.x = BUBBLE_PADDING;
      text.y = BUBBLE_PADDING;

      const container = new PIXI.Container();
      container.addChild(bubble);
      container.addChild(text);

      spriteData.currentBubble = { container, bubble, text };
      stage.addChild(container);
    }

    const { container, bubble, text } = spriteData.currentBubble;

    if (spriteData.sayTimeout != null) {
      clearTimeout(spriteData.sayTimeout);
      spriteData.sayTimeout = null;
    }

    if (text.text !== message) {
      text.text = message;

      const bubbleWidth = text.width + BUBBLE_PADDING * 2;
      const bubbleHeight = text.height + BUBBLE_PADDING * 2;

      bubble.clear();
      bubble.beginFill(BUBBLE_COLOR);
      bubble.lineStyle(2, LINE_COLOR);
      bubble.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, 10);

      bubble.moveTo(bubbleWidth / 2 - BUBBLE_TAIL_WIDTH / 2, bubbleHeight);
      bubble.lineTo(bubbleWidth / 2, bubbleHeight + BUBBLE_TAIL_HEIGHT);
      bubble.lineTo(bubbleWidth / 2 + BUBBLE_TAIL_WIDTH / 2, bubbleHeight);
      bubble.closePath();
      bubble.endFill();
    }

    const pos = calculateBubblePosition(
      sprite,
      bubble.width,
      bubble.height,
      BUBBLE_TAIL_HEIGHT
    );
    container.x = pos.x;
    container.y = pos.y;

    container.visible = true;

    if (typeof seconds === "number" && seconds > 0) {
      spriteData.sayTimeout = setTimeout(() => {
        container.visible = false;
        spriteData.sayTimeout = null;
      }, Math.min(seconds * 1000, 2147483647));
    }
  }

  function waitOneFrame() {
    return new Promise((res, rej) => {
      if (stopped()) return rej("stopped");

      const id = requestAnimationFrame(() => {
        if (stopped()) return rej("stopped");
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
      if (stopped()) return rej("stopped");

      const id = setTimeout(() => {
        if (stopped()) return rej("stopped");
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
    if (stopped()) return;

    const found = costumeMap.get(name);
    if (found) {
      sprite.texture = found.texture;
    }
  }

  function setSize(amount, additive) {
    if (stopped()) return;

    if (additive) {
      const scaleX = sprite.scale.x + amount / 100;
      const scaleY = sprite.scale.y + amount / 100;
      sprite.scale.set(scaleX, scaleY);
    } else {
      const scale = amount / 100;
      sprite.scale.set(scale, scale);
    }
  }

  function setAngle(amount, additive) {
    if (stopped()) return;

    if (additive) {
      sprite.angle = (sprite.angle + amount) % 360;
    } else {
      sprite.angle = amount % 360;
    }

    if (sprite.angle < 0) {
      sprite.angle += 360;
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

    return !!mouseButtonsPressed[+button];
  }

  function getCostumeSize(type) {
    const frame = sprite?.texture?.frame;
    if (!frame) return 0;

    if (type === "width") return frame.width;
    else if (type === "height") return frame.height;
    else return 0;
  }

  function getSpriteScale() {
    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;
    return ((scaleX + scaleY) / 2) * 100;
  }

  function _startTween({ from, to, duration, easing, onUpdate, wait = true }) {
    if (stopped()) return "shouldStop";

    const tweenPromise = new Promise((resolve, reject) => {
      const start = performance.now();
      const change = to - from;
      const easeFn = window.TweenEasing[easing] || window.TweenEasing.linear;

      function tick(now) {
        if (stopped()) return resolve("shouldStop");

        const t = Math.min((now - start) / (duration * 1000), 1);
        const value = from + change * easeFn(t);

        if (onUpdate) {
          const result = onUpdate(value);
          if (result === "shouldStop") return resolve("shouldStop");
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
    if (stopped()) return;
    const result = await _startTween(options);
    if (result === "shouldStop") return;
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
    const sound = soundMap.get(name);
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
    const mouse = renderer.plugins.interaction.mouse.global;
    const bounds = sprite.getBounds();
    return bounds.contains(mouse.x, mouse.y);
  }

  function setPenStatus(active) {
    spriteData.penDown = !!active;
  }

  function setPenColor(r, g, b) {
    if (typeof r === "string") {
      const [r_, g_, b_] = r.split(",");
      r = +r_;
      g = +g_;
      b = +b_;
    }
    spriteData.penColor = (r << 16) | (g << 8) | b;
  }

  function setPenColorHex(value) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    spriteData.penColor = result
      ? (parseInt(result[1], 16) << 16) |
        (parseInt(result[2], 16) << 8) |
        parseInt(result[3], 16)
      : 0x000000;
  }

  function setPenSize(size) {
    spriteData.penSize = Math.max(1, +size);
  }

  function clearPen() {
    penGraphics.clear();
  }

  eval(code);
}

export function showPopup({ innerHTML = "", title = "", rows = [] }) {
  const popup = document.createElement("div");
  popup.className = "popup";

  const rowsHTML = rows
    .map((row, rowIndex) => {
      const rowHTML = row
        .map((item, colIndex) => {
          if (typeof item === "string") {
            return `<span class="popup-label">${item}</span>`;
          }

          switch (item.type) {
            case "button":
              return `<button class="${
                item.className || ""
              }" data-row="${rowIndex}" data-col="${colIndex}">
                ${item.label}
              </button>`;
            case "input":
              return `<input
                type="${item.inputType || "text"}" 
                placeholder="${item.placeholder || ""}"
                value="${item.value || ""}" 
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
              />`;
            case "checkbox":
              return `<input
                type="checkbox"
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
                ${item.checked ? "checked" : ""}
              />`;
            case "textarea":
              return `<textarea
                placeholder="${item.placeholder || ""}"
                rows="${item.rows || 3}"
                cols="${item.cols || 30}"
                class="${item.className || ""}"
                data-row="${rowIndex}" data-col="${colIndex}"
              >${item.value || ""}</textarea>`;
            case "label":
              return `<span class="popup-label">${item.text}</span>`;
            default:
              return "";
          }
        })
        .join("");
      return `<div class="popup-row">${rowHTML}</div>`;
    })
    .join("");

  popup.innerHTML = `
    <div class="popup-content">
      <header>
        <h2>${title}</h2>
        <button class="popup-close danger">×</button>
      </header>
      <div class="popup-body">
        ${rowsHTML}
        ${innerHTML}
      </div>
    </div>`;

  document.body.appendChild(popup);

  popup.querySelector(".popup-close").addEventListener("click", () => {
    popup.remove();
  });

  rows.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      if (item.type === "button" && item.onClick) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("click", () => item.onClick(popup));
      }
      if (item.type === "input" && item.onInput) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("input", (e) =>
            item.onInput(e.target.value, popup)
          );
      }
      if (item.type === "checkbox" && item.onChange) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("change", (e) =>
            item.onChange(e.target.checked, popup)
          );
      }
      if (item.type === "textarea" && item.onInput) {
        popup
          .querySelector(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
          .addEventListener("input", (e) =>
            item.onInput(e.target.value, popup)
          );
      }
    });
  });

  return popup;
}
