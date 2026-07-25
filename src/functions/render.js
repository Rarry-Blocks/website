import * as Blockly from "blockly/core";
const svgPaths = Blockly.utils.svgPaths;

/**
 * @param {Blockly.BlockSvg} block
 * @returns {Blockly.BlockSvg|null}
 */
function nearestRealAncestor(block) {
  let current = block.getParent();
  while (current?.isShadow()) current = current.getParent();
  return current ?? null;
}

export const customShapeRegistry = new Map();
export const customNotchRegistry = new Map();
class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
  init() {
    super.init();
    this._customShapeCache = new Map();
    this._customNotchCache = new Map();
  }

  /**
   * @param {Blockly.RenderedConnection} connection
   * @override
   */
  shapeFor(connection) {
    if (!connection.sourceBlock_) {
      return super.shapeFor(connection);
    }

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
              pathRight: pathFn.pathRight(this.NOTCH_WIDTH, this.NOTCH_HEIGHT, svgPaths)
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

    if (
      connection.type === Blockly.ConnectionType.INPUT_VALUE ||
      connection.type === Blockly.ConnectionType.OUTPUT_VALUE
    ) {
      if (
        localStorage.getItem("squaredStrings") === "true" &&
        checks.includes("String") &&
        connection?.sourceBlock_?.isShadow() &&
        connection?.targetConnection?.shadowState?.type === "text"
      ) {
        return this.SQUARED;
      }

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
              pathRightUp: h => resolve(h, true, true)
            };
          }

          const shape = typeof path === "function" ? buildShape() : path;
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
    if (block.isShadow()) {
      if (block.canDuplicateOnDrag()) {
        super.applyColour(block);
        this.svgPath.setAttribute("fill", block.style.colourPrimary);
        this.svgPath.setAttribute("stroke", block.style.colourTertiary);
        return;
      } else {
        const ancestor = nearestRealAncestor(block);
        if (ancestor) {
          if (!block.style.isShadowProxy) {
            block.style = Object.create(block.style);
            block.style.isShadowProxy = true;
          }
          block.style.colourPrimary = ancestor.style.colourTertiary;
          block.style.colourSecondary = ancestor.style.colourTertiary;
          block.style.colourTertiary = ancestor.style.colourTertiary;
          this.style = block.style;
        }
      }
    }
    super.applyColour(block);
  }
}

const origFieldDropdown = Blockly.FieldDropdown.prototype.init;
Blockly.FieldDropdown.prototype.init = function() {
  origFieldDropdown.call(this);
  if (this.borderRect_ && this.sourceBlock_ && this.sourceBlock_.isOnlyField(this)) {
    this.borderRect_.style.stroke = "transparent";
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
