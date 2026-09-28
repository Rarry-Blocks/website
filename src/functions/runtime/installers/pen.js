import { Text, TextStyle } from "pixi.js-legacy";
import { penGraphics } from "../../../scripts/editor";

export function install({ getTargetData }) {
  function setPenStatus(active) {
    getTargetData().penDown = !!active;
  }

  function penPrint(message, x, y) {
    const targetData = getTargetData();

    const style = new TextStyle({
      fill: targetData.penColor || 0x000000,
      fontSize: (targetData.penSize || 1) * 12,
      fontFamily: "Arial"
    });

    const textObj = new Text(String(message), style);
    textObj.x = +x;
    textObj.y = -y;
    textObj.rotation = targetData.penPrintDirection || 0;
    textObj.anchor.set(0.5, 0.5);

    penGraphics.addChild(textObj);
  }

  function setPenColor(r, g, b) {
    if (typeof r === "string") {
      const [r_, g_, b_] = r.split(",");
      r = +r_;
      g = +g_;
      b = +b_;
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

  function setPenPrintDirection(angle = 0) {
    const normalizedAngle = angle - 360 * Math.floor(angle / 360);
    getTargetData().penPrintDirection = (normalizedAngle * Math.PI) / 180;
  }

  function clearPen() {
    penGraphics.clear();
    for (let i = penGraphics.children.length - 1; i >= 0; i--) {
      penGraphics.children[i].destroy();
    }
  }

  return {
    setPenStatus,
    penPrint,
    setPenColor,
    setPenColorHex,
    setPenSize,
    setPenPrintDirection,
    clearPen
  };
}
