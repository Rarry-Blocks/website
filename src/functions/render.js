import * as Blockly from "blockly/core";
const svgPaths = Blockly.utils.svgPaths;

export const customShapeRegistry = new Map();
export const customNotchRegistry = new Map();
class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
  init() {
    super.init();
    this.BOWL = this.makeBowl();
    this.PILLOW = this.makePillow();
    this.SPIKEY = this.makeSpikey();
    this._customShapeCache = new Map();
    this._customNotchCache = new Map();
  }

  makeBowl() {
    const maxW = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxH = maxW * 2;

    function makeRoundPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const radius = height / 2;
      const sweep = right === up ? "0" : "1";
      return (
        svgPaths.arc(
          "a",
          "0 0," + sweep,
          radius,
          svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius),
        ) +
        svgPaths.lineOnAxis("v", (up ? -1 : 1) * remainingHeight) +
        svgPaths.arc(
          "a",
          "0 0," + sweep,
          radius,
          svgPaths.point((right ? -1 : 1) * radius, (up ? -1 : 1) * radius),
        )
      );
    }

    function makeMainPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const radius = height / 2;
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      const totalHeight = height + remainingHeight;

      return (
        svgPaths.lineOnAxis("h", radius * dirR) +
        svgPaths.curve("q", [
          svgPaths.point((radius / 2) * -dirR, dirU * (totalHeight / 2)),
          svgPaths.point(0, totalHeight * dirU),
        ]) +
        svgPaths.lineOnAxis("h", radius * -dirR)
      );
    }

    return {
      type: this.SHAPES.ROUND,
      isDynamic: true,
      width(height) {
        const half = height / 2;
        return half > maxW ? maxW : half;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(height) {
        return height / 2;
      },
      connectionOffsetX(width) {
        return -width;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return makeRoundPath(height, false, true);
      },
      pathRightUp(height) {
        return makeRoundPath(height, false, true);
      },
    };
  }

  makePillow() {
    const maxW = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxH = maxW * 2;

    function makeMainPath(blockHeight, up, right) {
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const totalHeight = height + remainingHeight;
      const radius = (height / 4) * dirR;
      const radiusHeight = (totalHeight / 3) * dirU;

      return `
        h ${radius}
        q 0 ${radiusHeight} ${radius} ${radiusHeight}
        v ${radiusHeight}
        q ${-radius} 0 ${-radius} ${radiusHeight}
        h ${-radius}
      `;
    }

    return {
      type: this.SHAPES.ROUND,
      isDynamic: true,
      width(height) {
        const half = height / 2;
        return half > maxW ? maxW : half;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(connectionHeight) {
        return connectionHeight / 2;
      },
      connectionOffsetX(connectionWidth) {
        return -connectionWidth;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return makeMainPath(height, false, true);
      },
      pathRightUp(height) {
        return makeMainPath(height, false, true);
      },
    };
  }

  makeSpikey() {
    const maxW = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxH = maxW * 2;
    const roundedCopy = this.ROUNDED;

    function makeMainPath(blockHeight, up, right) {
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const totalHeight = height + remainingHeight;
      const radius = (height / 4) * dirR;
      const radiusHeight = (totalHeight / 4) * dirU;

      return `
        h ${radius * 2}
        l ${-radius} ${radiusHeight}
        l ${radius} ${radiusHeight}
        l ${-radius} ${radiusHeight}
        l ${radius} ${radiusHeight}
        h ${-radius * 2}
      `;
    }

    return {
      type: this.SHAPES.ROUND,
      isDynamic: true,
      width(height) {
        const half = height / 2;
        return half > maxW ? maxW : half;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(height) {
        return height / 2;
      },
      connectionOffsetX(width) {
        return -width;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return roundedCopy.pathRightDown(height);
      },
      pathRightUp(height) {
        return roundedCopy.pathRightUp(height);
      },
    };
  }

  /**
   * @param {Blockly.RenderedConnection} connection
   * @override
   */
  shapeFor(connection) {
    if (!connection.sourceBlock_) {
      return super.shapeFor(connection);
    }

    const blockType = connection.sourceBlock_.type;

    if (
      connection.type === Blockly.ConnectionType.NEXT_STATEMENT ||
      connection.type === Blockly.ConnectionType.PREVIOUS_STATEMENT
    ) {
      const checks = connection.getCheck() ?? [];
      for (const checkType of checks) {
        if (customNotchRegistry.has(checkType)) {
          if (!this._customNotchCache.has(checkType)) {
            const pathFn = customNotchRegistry.get(checkType);
            const notch = super.makeNotch();
            const customNotch = {
              ...notch,
              pathLeft: pathFn.pathLeft(this.NOTCH_WIDTH, this.NOTCH_HEIGHT, svgPaths),
              pathRight: pathFn.pathRight(this.NOTCH_WIDTH, this.NOTCH_HEIGHT, svgPaths),
            };
            this._customNotchCache.set(checkType, customNotch);
          }
          return this._customNotchCache.get(checkType);
        }
      }
    }

    let checks = connection.getCheck() ?? [];
    if (!checks && connection.targetConnection)
      checks = connection.targetConnection.getCheck() ?? [];
    const outputShape = connection.sourceBlock_.getOutputShape();

    if (
      connection.type === Blockly.ConnectionType.INPUT_VALUE ||
      connection.type === Blockly.ConnectionType.OUTPUT_VALUE
    ) {
      if (
        (checks.includes("Array") || outputShape === 4) &&
        !["text_length", "text_isEmpty"].includes(connection.sourceBlock_.type)
      ) {
        return this.BOWL;
      } else if (checks.includes("Object") || outputShape === 5) {
        return this.PILLOW;
      } else if (checks.includes("Set") || outputShape === 6) {
        return this.SPIKEY;
      } /*else if (
        checks.includes("String") &&
        connection?.sourceBlock_?.isShadow() &&
        connection?.targetConnection?.shadowState?.type === "text"
      ) {
        return this.SQUARED;
      }*/

      for (const typeName of checks) {
        if (!customShapeRegistry.has(typeName)) continue;

        if (!this._customShapeCache.has(typeName)) {
          const path = customShapeRegistry.get(typeName);
          const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
          const maxHeight = maxWidth * 2;
          const shapes = this.SHAPES;

          function buildShape() {
            function resolve(blockHeight, up, right) {
              const height = Math.min(blockHeight, maxHeight);
              const extra = blockHeight > maxHeight ? blockHeight - maxHeight : 0;
              return path(height, extra, up ? -1 : 1, right ? 1 : -1, svgPaths);
            }

            return {
              type: shapes.ROUND,
              isDynamic: true,
              width: h => Math.min(h / 2, maxWidth),
              height: h => h,
              connectionOffsetY: h => h / 2,
              connectionOffsetX: w => -w,
              pathDown: h => resolve(h, false, false),
              pathUp: h => resolve(h, true, false),
              pathRightDown: h => resolve(h, false, true),
              pathRightUp: h => resolve(h, true, true),
            };
          }

          const shape = typeof path === "function" ? buildShape() : entry;
          this._customShapeCache.set(typeName, shape);
        }

        return this._customShapeCache.get(typeName);
      }
    }

    return super.shapeFor(connection);
  }
}

class CustomPathObject extends Blockly.zelos.PathObject {
  applyColour(block) {
    super.applyColour(block);
    if (block.isShadow() && block.canDuplicateOnDrag?.()) {
      this.svgPath.setAttribute("fill", block.style.colourPrimary);
      this.svgPath.setAttribute("stroke", block.style.colourTertiary);
    }
  }
}

export default class CustomRenderer extends Blockly.zelos.Renderer {
  constructor() {
    super();
  }

  makeConstants_() {
    return new CustomConstantProvider();
  }

  makePathObject(root, style) {
    return new CustomPathObject(root, style, this.getConstants());
  }
}
