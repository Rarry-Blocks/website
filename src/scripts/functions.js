import { calculateBubblePosition } from "./editor";

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
  runningScripts
}) {
  function whenFlagClicked(callback) {
    if (
      thisRun !== currentRunId ||
      window.shouldStop ||
      (signal && signal.aborted)
    )
      return;

    const runId = thisRun;

    flagEvents.push({
      runId,
      cb: async () => {
        if (
          runId !== currentRunId ||
          window.shouldStop ||
          (signal && signal.aborted)
        )
          return;

        try {
          await promiseWithAbort(() => callback(), signal);
          if (
            runId !== currentRunId ||
            window.shouldStop ||
            (signal && signal.aborted)
          )
            return;
        } catch (e) {
          if (e?.message === "shouldStop") return;
          console.error(e);
        }
      },
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
      return Math.round((mouse.x - app.renderer.width / 2) / app.stage.scale.x);
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
      if (window.shouldStop || thisRun !== currentRunId) return rej("stopped");

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
      if (window.shouldStop || thisRun !== currentRunId) return rej("stopped");

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

  function _startTween({ from, to, duration, easing, onUpdate, wait = true }) {
    if (thisRun !== currentRunId) return;
    const tweenPromise = new Promise((resolve, reject) => {
      const start = performance.now();
      const change = to - from;
      const easeFn = window.TweenEasing[easing] || window.TweenEasing.linear;

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
}
