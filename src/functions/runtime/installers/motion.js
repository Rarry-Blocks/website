import { app } from "../../../scripts/editor";

export function install({ getTarget }) {
  const renderer = app.renderer;
  const stage = app.stage;

  function moveSteps(steps = 0) {
    const sprite = getTarget();
    const { rotation: a } = sprite;
    sprite.x += Math.cos(a) * steps;
    sprite.y += Math.sin(a) * steps;
  }

  function setAngle(amount = 0, additive = false) {
    const sprite = getTarget();
    const newAngle = additive ? sprite.angle + amount : amount;
    sprite.angle = newAngle - 360 * Math.floor(newAngle / 360);
  }

  function pointsTowards(x, y) {
    const sprite = getTarget();
    const { width, height } = renderer;
    const targetX = width / 2 + -x * stage.scale.x;
    const targetY = height / 2 - y * stage.scale.y;
    const spriteX = width / 2 + sprite.x * stage.scale.x;
    const spriteY = height / 2 - sprite.y * stage.scale.y;
    sprite.angle =
      (Math.atan2(-(targetX - spriteX), -(targetY - spriteY)) *
        (180 / Math.PI)) %
      360;
  }

  return { moveSteps, setAngle, pointsTowards };
}
