import { Container, Graphics, Text, TextStyle } from "pixi.js-legacy";
import { app, calculateBubblePosition } from "../../../scripts/editor";

const BUBBLE_PADDING = 10;
const BUBBLE_TAIL_HEIGHT = 15;
const BUBBLE_TAIL_WIDTH = 15;
const BUBBLE_COLOR = 0xffffff;
const BUBBLE_TEXTSTYLE = new TextStyle({ fill: 0x000000, fontSize: 24 });
const LINE_COLOR = 0xbdc1c7;

export function install({ getTarget, getTargetData }) {
  const stage = app.stage;

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
      const bubble = new Graphics();
      const text = new Text("", BUBBLE_TEXTSTYLE);
      text.x = BUBBLE_PADDING;
      text.y = BUBBLE_PADDING;

      const container = new Container();
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

  function switchCostume(value) {
    const costumes = getTargetData().costumes;
    const found =
      costumes.find((i) => i.id === value) ||
      costumes.find((i) => i.name === value);
    if (found) {
      getTarget().texture = found.texture;
    }
  }

  function setSize(amount = 0, additive) {
    const sprite = getTarget();
    const amountN = amount / 100;
    if (additive)
      sprite.scale.set(sprite.scale.x + amountN, sprite.scale.y + amountN);
    else sprite.scale.set(amountN, amountN);
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

  function toggleVisibility(bool = true) {
    const data = getTargetData();
    data.pixiSprite.visible = bool;
    if (data.currentBubble) data.currentBubble.visible = bool;
  }

  return {
    sayMessage,
    switchCostume,
    setSize,
    getCostumeSize,
    getSpriteScale,
    toggleVisibility
  };
}
