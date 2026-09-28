import {
  app,
  keysPressed,
  mouseButtonsPressed,
  projectBlockValues,
  projectVariables,
  spriteManager,
  stopProject,
  vm
} from "../../scripts/editor";
import { extensionBridges, extensions } from "../extensionManager";

export function createCore({
  spriteData,
  signal,
  projectStartedTime,
  onClickResult
}) {
  const renderer = app.renderer;
  const stage = app.stage;

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

  function projectTime() {
    return (Date.now() - projectStartedTime) / 1000;
  }

  function* wait(ms) {
    const startTime = Date.now();
    while (Date.now() - startTime < ms) {
      if (stopped()) return;
      yield;
    }
  }

  function* waitForPromise(promise) {
    if (!promise || typeof promise.then !== "function") return promise;

    let done = false;
    let res, err;

    promise.then(
      (v) => {
        res = v;
        done = true;
      },
      (e) => {
        err = e;
        done = true;
      }
    );

    while (!done) {
      if (stopped()) return;
      yield;
    }

    if (err) throw err;
    return res;
  }

  function setClickResult(value, error = false) {
    if (onClickResult) onClickResult(value, error);
  }

  function getMousePosition(axis) {
    const mouse = renderer.events.pointer.global;
    if (axis === "x")
      return Math.round((mouse.x - renderer.width / 2) / stage.scale.x);
    else if (axis === "y")
      return -Math.round((mouse.y - renderer.height / 2) / stage.scale.y);
  }

  function listKeysPressed() {
    return Object.keys(keysPressed).filter((p) => keysPressed[p]);
  }

  function isKeyPressed(key) {
    if (key === "any") return Object.values(keysPressed).some((p) => p);
    return !!keysPressed[key];
  }

  function isMouseButtonPressed(button) {
    if (button === "any")
      return Object.values(mouseButtonsPressed).some((p) => p);
    return !!mouseButtonsPressed[button];
  }

  function isMouseTouchingSprite() {
    const sprite = getTarget();
    const mouse = renderer.events.pointer.global;
    const bounds = sprite.getBounds();
    return bounds.contains(mouse.x, mouse.y);
  }

  function stopSprite(id) {
    const target = spriteManager.get(id);
    if (target) vm.stopForTarget(target);
  }

  function isOverBudget() {
    return vm.isOverBudget();
  }

  return {
    getTarget,
    getTargetData,
    getMousePosition,
    isKeyPressed,
    isMouseButtonPressed,
    isMouseTouchingSprite,
    isOverBudget,
    listKeysPressed,
    projectTime,
    setClickResult,
    stopProject,
    stopSprite,
    stopped,
    wait,
    waitForPromise
  };
}

export function coreGlobals() {
  return {
    vm,
    spriteManager,
    projectVariables,
    projectBlockValues,
    extensions,
    extensionBridges
  };
}
