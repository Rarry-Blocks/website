import * as Blockly from "blockly/core";

class CustomChecker extends Blockly.ConnectionChecker {
  canConnect(a, b, isDragging, opt_distance) {
    if (!isDragging) {
      return super.canConnect(a, b, isDragging, opt_distance);
    }

    /** @type {Blockly.BlockSvg} */
    const existing = b.targetConnection && b.targetConnection.getSourceBlock();

    if (existing && existing?.canDuplicateOnDrag?.()) {
      return false;
    }

    return super.canConnect(a, b, isDragging, opt_distance);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_CHECKER,
  "CustomChecker",
  CustomChecker,
  true,
);