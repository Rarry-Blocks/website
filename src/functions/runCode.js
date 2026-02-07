import * as PIXI from "pixi.js-legacy";
import {
  calculateBubblePosition,
  keysPressed,
  mouseButtonsPressed,
  playingSounds,
  eventRegistry,
  penGraphics,
  app,
  spriteManager,
  vm
} from "../scripts/editor";
import { tweenEasing } from "./utils";

const BUBBLE_PADDING = 10;
const BUBBLE_TAIL_HEIGHT = 15;
const BUBBLE_TAIL_WIDTH = 15;
const BUBBLE_COLOR = 0xffffff;
const BUBBLE_TEXTSTYLE = new PIXI.TextStyle({ fill: 0x000000, fontSize: 24 });
const LINE_COLOR = 0xbdc1c7;

export function triggerCloneEvents(clone) {
  const rootId = clone.root ? clone.root.id : clone.id;

  const entries = eventRegistry.clone.filter(entry => {
    return entry.spriteId === rootId;
  });

  entries.forEach(entry => {
    vm.execute(entry.generatorFunc, clone);
  });
}

export function runCodeWithFunctions({
  code,
  projectStartedTime,
  spriteData,
  signal
}) {
  const renderer = app.renderer;
  const stage = app.stage;

  const costumeMap = new Map((spriteData.costumes || []).map((c) => [c.name, c]));
  const soundMap = new Map((spriteData.sounds || []).map((s) => [s.name, s]));

  function getTarget() {
    if (vm.currentThread && vm.currentThread.target) {
      return vm.currentThread.target.pixiSprite;
    }
    return spriteData.pixiSprite;
  }

  function getTargetData() {
    if (vm.currentThread && vm.currentThread.target) {
      return vm.currentThread.target;
    }
    return spriteData;
  }

  function stopped() {
    return signal.aborted === true;
  }

  function registerEvent(type, key, generatorFunc) {
    if (stopped()) return;

    const entry = {
      type,
      spriteId: spriteData.id,
      generatorFunc,
      trigger: () => {
        const rootSprite = spriteManager.get(spriteData.id);
        if (!rootSprite) return;

        vm.execute(generatorFunc, rootSprite);

        if (rootSprite.clones) {
          rootSprite.clones.forEach(clone => {
            vm.execute(generatorFunc, clone);
          });
        }
      }
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
      case "clone":
        eventRegistry.clone.push(entry);
        break;
    }
  }

  function triggerCustomEvent(eventName) {
    const entries = eventRegistry.custom.get(eventName);
    if (!entries) return;
    for (const entry of entries) {
      entry.trigger();
    }
  }

  function moveSteps(steps = 0) {
    const sprite = getTarget();
    const { rotation: a } = sprite;
    sprite.x += Math.cos(a) * steps;
    sprite.y += Math.sin(a) * steps;
  }

  function getMousePosition(menu) {
    const mouse = renderer.events.pointer.global;
    if (menu === "x") return Math.round((mouse.x - renderer.width / 2) / stage.scale.x);
    else if (menu === "y") return -Math.round((mouse.y - renderer.height / 2) / stage.scale.y);
  }

  function sayMessage(message, seconds) {
    const targetData = getTargetData();
    const sprite = targetData.pixiSprite;

    message = String(message ?? "");

    if (!message) {
      if (targetData.currentBubble) {
        targetData.currentBubble.visible = false;
      }
      return;
    }

    if (!targetData.currentBubble) {
      const bubble = new PIXI.Graphics();
      const text = new PIXI.Text("", BUBBLE_TEXTSTYLE);
      text.x = BUBBLE_PADDING;
      text.y = BUBBLE_PADDING;

      const container = new PIXI.Container();
      container.addChild(bubble);
      container.addChild(text);
      container.bubble = bubble;
      container.text = text;

      targetData.currentBubble = container;
      stage.addChild(container);
    }

    const container = targetData.currentBubble;
    const { bubble, text } = container;

    if (targetData.sayTimeout) {
      clearTimeout(targetData.sayTimeout);
      targetData.sayTimeout = null;
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

    if (seconds > 0) {
      targetData.sayTimeout = setTimeout(() => {
        container.visible = false;
      }, seconds * 1000);
    }
  }

  function* waitOneFrame() {
    yield;
  }

  function* wait(ms) {
    const startTime = Date.now();
    while (Date.now() - startTime < ms) {
      if (stopped()) return;
      yield;
    }
  }

  function switchCostume(value) {
    const costumes = getTargetData().costumes;
    const found = costumes.find(i => i.id === value) || costumes.find(i => i.name === value)
    if (found) {
      getTarget().texture = found.texture;
    }
  }

  function setSize(amount = 0, additive) {
    const sprite = getTarget();
    let amountN = amount / 100;
    if (additive)
      sprite.scale.set(sprite.scale.x + amountN, sprite.scale.y + amountN);
    else sprite.scale.set(amountN, amountN);
  }

  function setAngle(amount, additive) {
    const sprite = getTarget();
    let angle = additive ? sprite.angle + amount : amount;
    angle = ((angle % 360) + 360) % 360;
    sprite.angle = angle;
  }

  function pointsTowards(x, y) {
    const sprite = getTarget();
    const { width, height } = renderer;
    const targetX = width / 2 + (-x) * stage.scale.x;
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
    if (key === "any") return Object.values(keysPressed).some((p) => p);
    return !!keysPressed[key];
  }

  function isMouseButtonPressed(button) {
    if (button === "any") return Object.values(mouseButtonsPressed).some((p) => p);
    return !!mouseButtonsPressed[button];
  }

  function getCostumeSize(type) {
    const sprite = getTarget();
    const frame = sprite?.texture?.frame;
    if (!frame) return 0;
    return type === "width" ? frame.width : frame.height;
  }

  function getSpriteScale() {
    const sprite = getTarget();
    return ((sprite.scale.x + sprite.scale.y) / 2) * 100;
  }

  function* startTween({ from, to, duration, easing, onUpdate, wait = true }) {
    if (stopped()) return;

    const easeFn = tweenEasing[easing] || tweenEasing.linear;
    const change = to - from;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    function* tweenRoutine() {
      while (true) {
        if (stopped()) return;

        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / durationMs, 1);

        const value = from + change * easeFn(t);

        if (onUpdate) onUpdate(value);

        if (t >= 1) break;
        yield;
      }
    }

    if (wait) {
      yield* tweenRoutine();
    } else {
      vm.execute(tweenRoutine, getTargetData());
    }
  }

  let soundProperties = { volume: 100, speed: 100 };

  function setSoundProperty(property, value) {
    if (!soundProperties[property]) return;
    if (property === "speed") value = Math.min(1600, Math.max(7, value));
    if (property === "volume") value = Math.min(100, Math.max(0, value));
    soundProperties[property] = value;
  }

  function* playSound(name, wait = false) {
    const targetData = getTargetData();
    const sound = soundMap.get(name);
    if (!sound) return;

    if (!playingSounds.has(targetData.id))
      playingSounds.set(targetData.id, new Map());

    const spriteSounds = playingSounds.get(targetData.id);

    const oldAudio = spriteSounds.get(name);
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.currentTime = 0;
    }

    const audio = new Audio(sound.dataURL);
    spriteSounds.set(name, audio);

    audio.volume = soundProperties.volume / 100;
    audio.playbackRate = soundProperties.speed / 100;

    let finished = false;
    const onEnd = () => { finished = true; };

    audio.addEventListener("ended", onEnd);
    audio.addEventListener("pause", onEnd);
    audio.addEventListener("error", onEnd);

    audio.play().catch(e => {
      console.warn("Audio play failed", e);
      finished = true;
    });

    const cleanup = () => {
      if (spriteSounds.get(name) === audio) {
        spriteSounds.delete(name);
      }
    };
    audio.addEventListener("ended", cleanup);

    if (wait) {
      while (!finished) {
        if (stopped()) {
          audio.pause();
          return;
        }
        yield;
      }
    }
  }

  function stopSound(name) {
    const targetData = getTargetData();
    const spriteSounds = playingSounds.get(targetData.id);
    if (!spriteSounds || !spriteSounds.has(name)) return;

    const audio = spriteSounds.get(name);
    audio.pause();
    audio.currentTime = 0;
    spriteSounds.delete(name);
  }

  function stopAllSounds(thisSprite = false) {
    if (thisSprite) {
      const targetData = getTargetData();
      const spriteSounds = playingSounds.get(targetData.id);
      if (!spriteSounds) return;

      for (const audio of spriteSounds.values()) {
        audio.pause();
        audio.currentTime = 0;
      }
      playingSounds.delete(targetData.id);
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
    const sprite = getTarget();
    const mouse = renderer.events.pointer.global;
    const bounds = sprite.getBounds();
    return bounds.contains(mouse.x, mouse.y);
  }

  function setPenStatus(active) {
    getTargetData().penDown = !!active;
  }

  function setPenColor(r, g, b) {
    if (typeof r === "string") {
      const [r_, g_, b_] = r.split(",");
      r = +r_; g = +g_; b = +b_;
    }
    getTargetData().penColor = (r << 16) | (g << 8) | b;
  }

  function setPenColorHex(value) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    getTargetData().penColor = result
      ? (parseInt(result[1], 16) << 16) |
      (parseInt(result[2], 16) << 8) |
      parseInt(result[3], 16)
      : 0x000000;
  }

  function setPenSize(size = 0) {
    getTargetData().penSize = Math.max(1, size);
  }

  function clearPen() {
    penGraphics.clear();
  }

  function toggleVisibility(bool = true) {
    const data = getTargetData();
    data.pixiSprite.visible = bool;
    if (data.currentBubble) data.currentBubble.visible = bool;
  }

  const VM_FUNCTIONS = {
    registerEvent,
    triggerCustomEvent,
    moveSteps,
    getMousePosition,
    sayMessage,
    waitOneFrame,
    wait,
    switchCostume,
    setSize,
    setAngle,
    pointsTowards,
    projectTime,
    isKeyPressed,
    isMouseButtonPressed,
    getCostumeSize,
    getSpriteScale,
    startTween,
    setSoundProperty,
    playSound,
    stopSound,
    stopAllSounds,
    isMouseTouchingSprite,
    setPenStatus,
    setPenColor,
    setPenColorHex,
    setPenSize,
    clearPen,
    toggleVisibility,

    vm,
    stopped,
    getTarget,
    getTargetData,
    spriteManager
  };

  console.info('Compiling code:\n', code);
  try {
    const factory = new Function('VM_FUNCTIONS', `
      with (VM_FUNCTIONS) {
        var fastExecution = false;
        ${code}
      }
    `);

    factory(VM_FUNCTIONS);
  } catch (err) {
    console.error("Error compiling sprite code:", err);
  }
}