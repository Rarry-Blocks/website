import * as Blockly from "blockly";

class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
  init() {
    super.init();
    this.BOWL = this.makeBowl();
    this.PILLOW = this.makePillow();
    this.SPIKEY = this.makeSpikey();
  }

  makeBowl() {
    const maxW = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxH = maxW * 2;
    const roundedCopy = this.ROUNDED;

    function makeMainPath(blockHeight, up, right) {
      const extra = blockHeight > maxH ? blockHeight - maxH : 0;
      const h_ = Math.min(blockHeight, maxH);
      const h = h_ + extra;
      const radius = h / 2;
      const radiusH = Math.min(h_ / 2, maxH);
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      return `
        h ${radiusH * dirR}
        q ${(h_ / 4) * -dirR} ${radius * dirU} 0 ${h * dirU}
        h ${radiusH * -dirR}
      `;
    }

    return {
      type: this.SHAPES.ROUND,
      isDynamic: true,
      width(h) {
        const half = h / 2;
        return half > maxW ? maxW : half;
      },
      height(h) {
        return h;
      },
      connectionOffsetY(h) {
        return h / 2;
      },
      connectionOffsetX(w) {
        return -w;
      },
      pathDown(h) {
        return makeMainPath(h, false, false);
      },
      pathUp(h) {
        return makeMainPath(h, true, false);
      },
      pathRightDown(h) {
        return roundedCopy.pathRightDown(h);
      },
      pathRightUp(h) {
        return roundedCopy.pathRightUp(h);
      },
    };
  }

  makePillow() {
    const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxHeight = maxWidth * 2;

    function makeMainPath(blockHeight, up, right) {
      const remainingHeight =
        blockHeight > maxHeight ? blockHeight - maxHeight : 0;
      const height = blockHeight > maxHeight ? maxHeight : blockHeight;
      const radius = height / 8;

      const dirRight = right ? 1 : -1;
      const dirUp = up ? -1 : 1;

      const radiusW = radius * dirRight;
      const radiusH = radius * dirUp;

      return `
        h ${radiusW}
        q ${radiusW} 0 ${radiusW} ${radiusH}
        q 0 ${radiusH} ${radiusW} ${radiusH}
        q ${radiusW} 0 ${radiusW} ${radiusH}
        v ${(remainingHeight + height - radius * 6) * dirUp}
        q 0 ${radiusH} ${-radiusW} ${radiusH}
        q ${-radiusW} 0 ${-radiusW} ${radiusH}
        q 0 ${radiusH} ${-radiusW} ${radiusH}
        h ${-radiusW}
      `;
    }

    return {
      type: this.SHAPES.HEXAGONAL,
      isDynamic: true,
      width(height) {
        const halfHeight = height / 2;
        return halfHeight > maxWidth ? maxWidth : halfHeight;
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

    function makeMainPath(blockHeight, up, right) {
      const extra = blockHeight > maxH ? blockHeight - maxH : 0;
      const h_ = Math.min(blockHeight, maxH);
      const h = h_ + extra;
      const radius = h / 4;
      const radiusH = Math.min(h_ / 4, maxH);
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;

      return `
        h ${2 * radiusH * dirR}
        l ${radiusH * -dirR} ${radius * dirU}
        l ${radiusH * dirR} ${radius * dirU}
        l ${radiusH * -dirR} ${radius * dirU}
        l ${radiusH * dirR} ${radius * dirU}
        h ${2 * radiusH * -dirR}
      `;
    }

    return {
      type: this.SHAPES.HEXAGONAL,
      isDynamic: true,
      width(h) {
        const half = h / 2;
        return half > maxW ? maxW : half;
      },
      height(h) {
        return h;
      },
      connectionOffsetY(h) {
        return h / 2;
      },
      connectionOffsetX(w) {
        return -w;
      },
      pathDown(h) {
        return makeMainPath(h, false, false);
      },
      pathUp(h) {
        return makeMainPath(h, true, false);
      },
      pathRightDown(h) {
        return makeMainPath(h, false, true);
      },
      pathRightUp(h) {
        return makeMainPath(h, true, true);
      },
    };
  }

  /**
   * @param {Blockly.RenderedConnection} connection
   */
  shapeFor(connection) {
    let checks = connection.getCheck() ?? [];
    if (!checks && connection.targetConnection)
      checks = connection.targetConnection.getCheck() ?? [];
    let outputShape = connection.sourceBlock_.getOutputShape();

    if (connection.type === 1 || connection.type === 2) {
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
    }

    return super.shapeFor(connection);
  }
}

export default class CustomRenderer extends Blockly.zelos.Renderer {
  constructor() {
    super();
  }

  makeConstants_() {
    return new CustomConstantProvider();
  }
}
