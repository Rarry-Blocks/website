import * as Blockly from "blockly/core";

export class DuplicateOnDrag extends Blockly.dragging.BlockDragStrategy {
  /** @param {Blockly.BlockSvg} block */
  constructor(block) {
    super(block);
  }

  /** @override */
  isMovable() {
    return true;
  }

  startDrag(e) {
    if (!this.block.isShadow()) {
      this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.block);
      this.block.setDragStrategy(this.baseStrat);
      return this.baseStrat.startDrag(e);
    }

    const ws = this.block.workspace;
    const data = this.block.toCopyData();

    if (this.block.saveExtraState)
      data.blockState.extraState = this.block.saveExtraState();

    // Special case for function statement argument.
    if (
      this.block.type === "functions_argument_block" &&
      this.block.argType_ === "statement"
    ) {
      data.blockState.type = "functions_statement_argument_block";
    }

    /** @type {Blockly.BlockSvg} */
    this.copy = Blockly.clipboard.paste(data, ws);
    this.copy.setShadow(false);
    this.copy.render();
    this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.copy);
    this.copy.setDragStrategy(this.baseStrat);
    return this.baseStrat.startDrag(e);
  }

  drag(newLoc, e) {
    if (!this.copy) {
      this.baseStrat?.drag(newLoc, e);
      return;
    }
    this.baseStrat.drag(newLoc, e);
  }

  endDrag(e, disposition) {
    this.baseStrat?.endDrag(e, disposition);
  }

  revertDrag() {
    if (!this.copy) {
      this.baseStrat?.revertDrag();
      return;
    }
    this.copy?.dispose();
  }
}

Blockly.BlockSvg.prototype.duplicateOnDrag_ = false;

Blockly.BlockSvg.prototype.setDuplicateOnDrag = function (value) {
  if (!this.setDragStrategy) return;

  this.duplicateOnDrag_ = value;
  if (value === true) {
    this.setDragStrategy(new DuplicateOnDrag(this));
  } else {
    this.setDragStrategy(new Blockly.dragging.BlockDragStrategy(this));
  }
};

Blockly.BlockSvg.prototype.canDuplicateOnDrag = function () {
  return this.duplicateOnDrag_ && this.isShadow();
};

// Overrides Blockly 13.3 (PR #9538, "Don't select shadow blocks on click")
const ogHandleWsStart = Blockly.Gesture.prototype.handleWsStart;
Blockly.Gesture.prototype.handleWsStart = function (e, ws) {
  ogHandleWsStart.call(this, e, ws);
  const block = this.startBlock;
  if (
    block &&
    typeof block.isShadow === "function" &&
    block.isShadow() &&
    typeof block.canDuplicateOnDrag === "function" &&
    block.canDuplicateOnDrag()
  ) {
    Blockly.common.setSelected(block);
  }
};

const ogGetFocusableElement = Blockly.BlockSvg.prototype.getFocusableElement;
Blockly.BlockSvg.prototype.getFocusableElement = function () {
  if (
    typeof this.canDuplicateOnDrag === "function" &&
    this.canDuplicateOnDrag()
  ) {
    return this.pathObject.svgPath;
  }
  return ogGetFocusableElement.call(this);
};

const ogJsonInit = Blockly.BlockSvg.prototype.jsonInit;
Blockly.BlockSvg.prototype.jsonInit = function (json) {
  if (json["duplicateOnDrag"] !== undefined) {
    this.setDuplicateOnDrag(json["duplicateOnDrag"]);
  }
  ogJsonInit.call(this, json);
};

Blockly.Block.prototype.isOnlyField = function (field) {
  for (var i = 0; i < this.inputList.length; i++) {
    var input = this.inputList[i];
    if (!(input instanceof Blockly.inputs.DummyInput)) {
      return false;
    }
    for (var j = 0; j < input.fieldRow.length; j++) {
      if (input.fieldRow[j] !== field) {
        return false;
      }
    }
  }
  return true;
};
