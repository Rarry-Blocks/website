import * as PIXI from "pixi.js-legacy";
import { calculateBubblePosition, projectVariables } from "../scripts/editor";
import { Thread } from "./threads";
import { promiseWithAbort } from "./utils";

const BUBBLE_PADDING = 10;
const BUBBLE_TAIL_HEIGHT = 15;
const BUBBLE_TAIL_WIDTH = 15;
const BUBBLE_COLOR = 0xffffff;
const BUBBLE_TEXTSTYLE = new PIXI.TextStyle({ fill: 0x000000, fontSize: 24 });
const LINE_COLOR = 0xbdc1c7;

export function runCodeWithFunctions({
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
}) {
  Thread.resetAll();
  let fastExecution = false;

  const sprite = spriteData.pixiSprite;
  const renderer = app.renderer;
  const stage = app.stage;
  const costumeMap = new Map(
    (spriteData.costumes || []).map((c) => [c.name, c])
  );
  const soundMap = new Map((spriteData.sounds || []).map((s) => [s.name, s]));
  const extensions = window.extensions;
  const MyFunctions = {};

  function stopped() {
    return signal.aborted === true;
  }

  function registerEvent(type, key, callback) {
    if (stopped()) return;

    const entry = {
      type,
      cb: async () => {
        if (stopped()) return;

        const threadId = Thread.create();
        Thread.enter(threadId);
        activeEventThreads.count++;

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
          activeEventThreads.count--;
        }
      },
    };

    switch (type) {
      case "flag":
        eventRegistry.flag.push(entry);
        break;
      case "key":
        if (!eventRegistry.key.has(key)) eventRegistry.key.set(key, []);
        eventRegistry.key.get(key).push(entry);
        break;
      case "stageClick":
        eventRegistry.stageClick.push(entry);
        break;
      case "timer":
        eventRegistry.timer.push({ ...entry, value: key });
        break;
      case "interval":
        eventRegistry.interval.push({ ...entry, seconds: key });
        break;
      case "custom":
        if (!eventRegistry.custom.has(key)) eventRegistry.custom.set(key, []);
        eventRegistry.custom.get(key).push(entry);
        break;
    }
  }

  function triggerCustomEvent(eventName) {
    const entries = eventRegistry.custom.get(eventName);
    if (!entries) return;
    for (const entry of entries) {
      entry.cb();
    }
  }

  function moveSteps(steps = 0) {
    const { rotation: a } = sprite;
    sprite.x += Math.cos(a) * steps;
    sprite.y += Math.sin(a) * steps;
  }

  function getMousePosition(menu) {
    const mouse = renderer.events.pointer.global;
    if (menu === "x")
      return Math.round((mouse.x - renderer.width / 2) / stage.scale.x);
    else if (menu === "y")
      return -Math.round((mouse.y - renderer.height / 2) / stage.scale.y);
  }

  function sayMessage(message, seconds) {
    if (stopped()) return;

    message = String(message ?? "");
    if (!message) return;

    if (!spriteData.currentBubble) {
      const bubble = new PIXI.Graphics();
      const text = new PIXI.Text("", BUBBLE_TEXTSTYLE);
      text.x = BUBBLE_PADDING;
      text.y = BUBBLE_PADDING;

      const container = new PIXI.Container();
      container.addChild(bubble);
      container.addChild(text);
      container.bubble = bubble;
      container.text = text;

      spriteData.currentBubble = container;
      stage.addChild(container);
    }

    const container = spriteData.currentBubble;
    const { bubble, text } = container;

    if (spriteData.sayTimeout !== null) {
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
    const found = costumeMap.get(name);
    if (found) {
      sprite.texture = found.texture;
    }
  }

  function setSize(amount = 0, additive) {
    let amountN = amount / 100;
    if (additive)
      sprite.scale.set(sprite.scale.x + amountN, sprite.scale.y + amountN);
    else sprite.scale.set(amountN, amountN);
  }

  function setAngle(amount, additive) {
    let angle = additive ? sprite.angle + amount : amount
    angle = ((angle % 360) + 360) % 360;
    sprite.angle = angle;
  }

  function pointsTowards(x, y) {
    const { width, height } = renderer
    const targetX = width / 2 + x * stage.scale.x;
    const targetY = height / 2 - y * stage.scale.y;
    const spriteX = width / 2 + sprite.x * stage.scale.x;
    const spriteY = height / 2 - sprite.y * stage.scale.y;

    let angle = Math.atan2(targetX - spriteX, targetY - spriteY) * (180 / Math.PI);
    angle = ((angle % 360) + 360) % 360;
    sprite.angle = angle;
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

    return !!mouseButtonsPressed[button];
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

  function startTween({ from, to, duration, easing, onUpdate, wait = true }) {
    if (stopped()) return;

    const tweenPromise = new Promise((resolve) => {
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

  let soundProperties = {
    volume: 100,
    speed: 100,
  };

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
    const mouse = renderer.events.pointer.global;
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

  function setPenSize(size = 0) {
    spriteData.penSize = Math.max(1, size);
  }

  function clearPen() {
    penGraphics.clear();
  }

  function toggleVisibility(bool = true) {
    sprite.visible = bool;
    if (spriteData.currentBubble) spriteData.currentBubble.visible = bool;
  }
  
  eval(code);
}
