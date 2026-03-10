import * as Blockly from "blockly";
const svgPaths = Blockly.utils.svgPaths;

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

    function makeRoundPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxH ? blockHeight - maxH : 0;
      const height = blockHeight > maxH ? maxH : blockHeight;
      const radius = height / 2;
      const sweep = right === up ? '0' : '1';
      return (
        svgPaths.arc(
          'a',
          '0 0,' + sweep,
          radius,
          svgPaths.point((right ? 1 : -1) * radius, (up ? -1 : 1) * radius),
        ) +
        svgPaths.lineOnAxis('v', (up ? -1 : 1) * remainingHeight) +
        svgPaths.arc(
          'a',
          '0 0,' + sweep,
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
        svgPaths.lineOnAxis('h', radius * dirR) +
        svgPaths.curve('q', [
          svgPaths.point((radius / 2) * -dirR, dirU * (totalHeight / 2)),
          svgPaths.point(0, totalHeight * dirU),
        ]) +
        svgPaths.lineOnAxis('h', radius * -dirR)
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
      const extra = blockHeight > maxH ? blockHeight - maxH : 0;
      const h_ = Math.min(blockHeight, maxH);
      const h = h_ + extra;
      const radius = h / 4;
      const radiusH = Math.min(h_ / 2, maxH);
      const dirR = right ? 1 : -1;
      const dirU = up ? -1 : 1;
      const lineWidth = (h_ - extra) / 5;

      return `
        h ${radiusH * dirR}
        l ${lineWidth * -dirR} ${radius * dirU}
        l ${lineWidth * dirR} ${radius * dirU}
        l ${lineWidth * -dirR} ${radius * dirU}
        l ${lineWidth * dirR} ${radius * dirU}
        h ${radiusH * -dirR}
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
