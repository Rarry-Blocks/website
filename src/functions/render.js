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
  SHAPES = {
    HEXAGONAL: 1,
    ROUND: 2,
    SQUARE: 3,
    PILLOW: 4,
    BOWL: 5,
    SPIKEY: 6,
    PUZZLE: 7,
    NOTCH: 8
  };

  SHAPE_IN_SHAPE_PADDING = {
    // Outer shape: hexagon.
    1: {
      0: 5 * this.GRID_UNIT, // Field in hexagon.
      1: 2 * this.GRID_UNIT, // Hexagon in hexagon.
      2: 5 * this.GRID_UNIT, // Round in hexagon.
      3: 5 * this.GRID_UNIT, // Square in hexagon.
      4: 4 * this.GRID_UNIT, // Pillow in hexagon.
      5: { left: 5 * this.GRID_UNIT, right: 3 * this.GRID_UNIT }, // Bowl in hexagon.
      6: 5 * this.GRID_UNIT // Spikey in hexagon.
    },
    // Outer shape: round.
    2: {
      0: 3 * this.GRID_UNIT, // Field in round.
      1: 3 * this.GRID_UNIT, // Hexagon in round.
      2: 1 * this.GRID_UNIT, // Round in round.
      3: 4 * this.GRID_UNIT, // Square in round.
      4: 2 * this.GRID_UNIT, // Pillow in round.
      5: { left: 8 * this.GRID_UNIT, right: 1 * this.GRID_UNIT }, // Bowl in round.
      6: { left: 8 * this.GRID_UNIT, right: 1 * this.GRID_UNIT } // Spikey in round.
    },
    // Outer shape: square.
    3: {
      0: 2 * this.GRID_UNIT, // Field in square.
      1: 1 * this.GRID_UNIT, // Hexagon in square.
      2: 1 * this.GRID_UNIT, // Round in square.
      3: 1 * this.GRID_UNIT, // Square in square.
      4: 1 * this.GRID_UNIT, // Pillow in square.
      5: 1 * this.GRID_UNIT, // Bowl in square.
      6: 1 * this.GRID_UNIT // Spikey in square.
    },
    // Outer shape: pillow.
    4: {
      0: 4 * this.GRID_UNIT, // Field in pillow.
      1: 3 * this.GRID_UNIT, // Hexagon in pillow.
      2: 3 * this.GRID_UNIT, // Round in pillow.
      3: 4 * this.GRID_UNIT, // Square in pillow.
      4: 2 * this.GRID_UNIT, // Pillow in pillow.
      5: 5 * this.GRID_UNIT, // Bowl in pillow.
      6: 5 * this.GRID_UNIT // Spikey in pillow.
    },
    // Outer shape: bowl.
    5: {
      0: 4 * this.GRID_UNIT, // Field in bowl.
      1: { left: 4 * this.GRID_UNIT, right: 2 * this.GRID_UNIT }, // Hexagon in bowl.
      2: { left: 4 * this.GRID_UNIT, right: 1 * this.GRID_UNIT }, // Round in bowl.
      3: { left: 4 * this.GRID_UNIT, right: 5 * this.GRID_UNIT }, // Square in bowl.
      4: { left: 4 * this.GRID_UNIT, right: 2 * this.GRID_UNIT }, // Pillow in bowl.
      5: { left: 1.5 * this.GRID_UNIT, right: 1 * this.GRID_UNIT }, // Bowl in bowl.
      6: { left: 3 * this.GRID_UNIT, right: 1 * this.GRID_UNIT } // Spikey in bowl.
    },
    // Outer shape: spikey.
    6: {
      0: 4 * this.GRID_UNIT, // Field in spikey.
      1: { left: 4 * this.GRID_UNIT, right: 2 * this.GRID_UNIT }, // Hexagon in spikey.
      2: { left: 4 * this.GRID_UNIT, right: 1 * this.GRID_UNIT }, // Round in spikey.
      3: { left: 4 * this.GRID_UNIT, right: 5 * this.GRID_UNIT }, // Square in spikey.
      4: { left: 4 * this.GRID_UNIT, right: 2 * this.GRID_UNIT }, // Pillow in spikey.
      5: { left: 4 * this.GRID_UNIT, right: 1 * this.GRID_UNIT }, // Bowl in spikey.
      6: { left: 3 * this.GRID_UNIT, right: 1 * this.GRID_UNIT } // Spikey in spikey.
    }
  };

  MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH = 8 * this.GRID_UNIT;

  init() {
    super.init();
    this.PILLOW = this.makePillow();
    this.BOWL = this.makeBowl();
    this.SPIKEY = this.makeSpikey();
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
              type: shapes.HEXAGONAL,
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

    const outputShape = connection.sourceBlock_?.getOutputShape?.();
    if (outputShape === this.SHAPES.PILLOW) return this.PILLOW;
    if (outputShape === this.SHAPES.BOWL) return this.BOWL;
    if (outputShape === this.SHAPES.SPIKEY) return this.SPIKEY;

    if (checks.includes("Object")) return this.PILLOW;
    if (checks.includes("Array")) return this.BOWL;
    if (checks.includes("Set")) return this.SPIKEY;

    return super.shapeFor(connection);
  }

  makePillow() {
    const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxHeight = maxWidth * 2;

    function makeMainPath(height, up, right) {
      const extra = height > maxHeight ? height - maxHeight : 0;
      const _height = height > maxHeight ? maxHeight : height;
      const radius = _height / 8;

      const dirRight = right ? 1 : -1;
      const dirUp = up ? -1 : 1;

      const radiusW = radius * dirRight;
      const radiusH = radius * dirUp;

      return (
        svgPaths.lineOnAxis("h", radiusW) +
        svgPaths.curve("q", [
          svgPaths.point(radiusW, 0),
          svgPaths.point(radiusW, radiusH)
        ]) +
        svgPaths.curve("q", [
          svgPaths.point(0, radiusH),
          svgPaths.point(radiusW, radiusH)
        ]) +
        svgPaths.curve("q", [
          svgPaths.point(radiusW, 0),
          svgPaths.point(radiusW, radiusH)
        ]) +
        svgPaths.lineOnAxis("v", (extra + _height - radius * 6) * dirUp) +
        svgPaths.curve("q", [
          svgPaths.point(0, radiusH),
          svgPaths.point(-radiusW, radiusH)
        ]) +
        svgPaths.curve("q", [
          svgPaths.point(-radiusW, 0),
          svgPaths.point(-radiusW, radiusH)
        ]) +
        svgPaths.curve("q", [
          svgPaths.point(0, radiusH),
          svgPaths.point(-radiusW, radiusH)
        ]) +
        svgPaths.lineOnAxis("h", -radiusW)
      );
    }

    return {
      type: this.SHAPES.PILLOW,
      isDynamic: true,
      width: (height) => {
        const halfHeight = height / 2;
        return halfHeight > maxWidth ? maxWidth : halfHeight;
      },
      height: (height) => height,
      connectionOffsetY: (connectionHeight) => connectionHeight / 2,
      connectionOffsetX: (connectionWidth) => -connectionWidth,
      pathDown: (height) => makeMainPath(height, false, false),
      pathUp: (height) => makeMainPath(height, true, false),
      pathRightDown: (height) => makeMainPath(height, false, true),
      pathRightUp: (height) => makeMainPath(height, false, true)
    };
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
          svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius)
        ) +
        svgPaths.lineOnAxis("v", (up ? -1 : 1) * remainingHeight) +
        svgPaths.arc(
          "a",
          "0 0," + sweep,
          radius,
          svgPaths.point((right ? -1 : 1) * radius, (up ? -1 : 1) * radius)
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
          svgPaths.point(0, totalHeight * dirU)
        ]) +
        svgPaths.lineOnAxis("h", radius * -dirR)
      );
    }

    return {
      type: this.SHAPES.BOWL,
      isDynamic: true,
      width: (h) => {
        const half = h / 2;
        return half > maxW ? maxW : half;
      },
      height: (h) => h,
      connectionOffsetY: (h) => h / 2,
      connectionOffsetX: (w) => -w,
      pathDown: (h) => makeMainPath(h, false, false),
      pathUp: (h) => makeMainPath(h, true, false),
      pathRightDown: (h) => makeRoundPath(h, false, true),
      pathRightUp: (h) => makeRoundPath(h, false, true)
    };
  }

  makeSpikey() {
    const maxW = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxH = maxW * 2;

    function makeRoundedPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const radius = height / 2;
      const sweep = right === up ? "0" : "1";
      return (
        svgPaths.arc(
          "a",
          "0 0," + sweep,
          radius,
          svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius)
        ) +
        svgPaths.lineOnAxis("v", (up ? -1 : 1) * remainingHeight) +
        svgPaths.arc(
          "a",
          "0 0," + sweep,
          radius,
          svgPaths.point((right ? -1 : 1) * radius, (up ? -1 : 1) * radius)
        )
      );
    }

    function makeMainPath(blockHeight, up, right) {
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const totalHeight = height + remainingHeight;
      const radius = (height / 4) * dirR;
      const radiusHeight = (totalHeight / 4) * dirU;

      return (
        svgPaths.lineOnAxis("h", radius * 2) +
        svgPaths.line([svgPaths.point(-radius, radiusHeight)]) +
        svgPaths.line([svgPaths.point(radius, radiusHeight)]) +
        svgPaths.line([svgPaths.point(-radius, radiusHeight)]) +
        svgPaths.line([svgPaths.point(radius, radiusHeight)]) +
        svgPaths.lineOnAxis("h", -radius * 2)
      );
    }

    return {
      type: this.SHAPES.SPIKEY,
      isDynamic: true,
      width: (height) => {
        const halfHeight = height / 2;
        return halfHeight > maxW ? maxW : halfHeight;
      },
      height: (height) => height,
      connectionOffsetY: (connectionHeight) => connectionHeight / 2,
      connectionOffsetX: (connectionWidth) => -connectionWidth,
      pathDown: (height) => makeMainPath(height, false, false),
      pathUp: (height) => makeMainPath(height, true, false),
      pathRightDown: (height) => makeRoundedPath(height, false, true),
      pathRightUp: (height) => makeRoundedPath(height, false, true)
    };
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

const zelosTypes = Blockly.blockRendering.Types;
const InRowSpacer = Blockly.blockRendering.InRowSpacer;
const FieldTextInput = Blockly.FieldTextInput;

Blockly.zelos.RenderInfo.prototype.getNegativeSpacing_ = function (elem, side = "left") {
  if (!elem || !this.outputConnection) {
    return 0;
  }
  const connectionWidth = this.outputConnection.width;
  const outerShape = this.outputConnection.shape.type;
  const constants = this.constants_;

  const resolvePadding = (pad) => {
    if (pad == null) return 0;
    return typeof pad === "number" ? pad : (pad[side] ?? 0);
  };

  if (this.inputRows.length > 1) {
    switch (outerShape) {
      case constants.SHAPES.ROUND: {
        // Special case for multi-row round reporter blocks.
        const maxWidth = this.constants_.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
        const width = this.height / 2 > maxWidth ? maxWidth : this.height / 2;
        const topPadding = this.constants_.SMALL_PADDING;
        const roundPadding = width * (1 - Math.sin(Math.acos((width - topPadding) / width)));
        return connectionWidth - roundPadding;
      }
      default:
        return 0;
    }
  }
  if (zelosTypes.isInlineInput(elem)) {
    const connectedBlock = elem.connectedBlock;
    const innerShape = connectedBlock ? connectedBlock.pathObject.outputShapeType : elem.shape.type;
    if (innerShape == null) {
      return 0;
    }
    // Special case for value to stack / value to statement blocks.
    if (
      connectedBlock &&
      connectedBlock.outputConnection &&
      (connectedBlock.statementInputCount || connectedBlock.nextConnection)
    ) {
      return 0;
    }
    // Special case for hexagonal output.
    if (outerShape === constants.SHAPES.HEXAGONAL && outerShape !== innerShape) {
      return 0;
    }
    const pad = this.constants_.SHAPE_IN_SHAPE_PADDING[outerShape][innerShape];
    return connectionWidth - resolvePadding(pad);
  } else if (zelosTypes.isField(elem)) {
    // Special case for text inputs.
    if (outerShape === constants.SHAPES.ROUND && elem.field instanceof FieldTextInput) {
      return connectionWidth - 2.75 * constants.GRID_UNIT;
    }
    const pad = this.constants_.SHAPE_IN_SHAPE_PADDING[outerShape][0];
    return connectionWidth - resolvePadding(pad);
  } else if (zelosTypes.isIcon(elem)) {
    return this.constants_.SMALL_PADDING;
  }
  return 0;
};

Blockly.zelos.RenderInfo.prototype.finalizeHorizontalAlignment_ = function () {
  if (
    !this.outputConnection ||
    this.hasStatementInput ||
    this.bottomRow.hasNextConnection
  ) {
    return;
  }
  let totalNegativeSpacing = 0;
  for (let i = 0; i < this.rows.length; i++) {
    const row = this.rows[i];
    if (!zelosTypes.isInputRow(row)) {
      continue;
    }
    const firstElem = row.elements[1];
    const lastElem = row.elements[row.elements.length - 2];
    let leftNegPadding = this.getNegativeSpacing_(firstElem, "left");
    let rightNegPadding = this.getNegativeSpacing_(lastElem, "right");
    totalNegativeSpacing = leftNegPadding + rightNegPadding;
    const minBlockWidth =
      this.constants_.MIN_BLOCK_WIDTH + this.outputConnection.width * 2;
    if (this.width - totalNegativeSpacing < minBlockWidth) {
      // Maintain a minimum block width, split negative spacing between left
      // and right edge.
      totalNegativeSpacing = this.width - minBlockWidth;
      leftNegPadding = totalNegativeSpacing / 2;
      rightNegPadding = totalNegativeSpacing / 2;
    }
    // Add a negative spacer on the start and end of the block.
    row.elements.unshift(new InRowSpacer(this.constants_, -leftNegPadding));
    row.elements.push(new InRowSpacer(this.constants_, -rightNegPadding));
  }
  if (totalNegativeSpacing) {
    this.width -= totalNegativeSpacing;
    this.widthWithChildren -= totalNegativeSpacing;
    this.rightSide.xPos -= totalNegativeSpacing;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      if (zelosTypes.isTopOrBottomRow(row)) {
        row.elements[1].width -= totalNegativeSpacing;
      }
      row.width -= totalNegativeSpacing;
      row.widthWithConnectedBlocks -= totalNegativeSpacing;
    }
  }
};

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
