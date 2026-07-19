import * as Blockly from "blockly/core";

export class CustomChecker extends Blockly.ConnectionChecker {
  doTypeChecks(a, b) {
    if (!super.doTypeChecks(a, b)) {
      return false;
    }

    if (this.violatesExclusivity(a, b) || this.violatesExclusivity(b, a)) {
      return false;
    }

    return true;
  }

  canConnect(a, b, isDragging, opt_distance) {
    if (isDragging) {
      const existing = b?.targetConnection?.getSourceBlock();

      if (
        existing &&
        typeof existing.canDuplicateOnDrag === "function" &&
        existing.canDuplicateOnDrag()
      ) {
        return false;
      }
    }

    return super.canConnect(a, b, isDragging, opt_distance);
  }

  violatesExclusivity(conn, target) {
    const block = conn.getSourceBlock();
    if (!block) {
      return false;
    }

    const hasOutput = !!block.outputConnection;
    const hasPrevious = !!block.previousConnection;
    const hasNext = !!block.nextConnection;
    const isDualBlock = hasOutput && (hasPrevious || hasNext);

    if (!isDualBlock) {
      return false;
    }

    if (conn === block.outputConnection) {
      const isPrevConnected = !!block.previousConnection?.isConnected();
      const isNextConnected = !!block.nextConnection?.isConnected();

      if (isPrevConnected || isNextConnected) {
        return true;
      }
    }

    if (conn === block.previousConnection || conn === block.nextConnection) {
      const isOutputConnected = !!block.outputConnection?.isConnected();

      if (isOutputConnected) {
        return true;
      }
    }

    return false;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_CHECKER,
  "CustomChecker",
  CustomChecker,
  true,
);
